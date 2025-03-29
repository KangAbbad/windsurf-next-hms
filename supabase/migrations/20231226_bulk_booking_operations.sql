-- Create type for booking input
CREATE TYPE public.booking_input AS (
  guest_id uuid,
  payment_status_id uuid,
  room_ids uuid[],
  addon_ids uuid[],
  checkin_date date,
  checkout_date date,
  num_adults integer,
  num_children integer,
  amount decimal
);

-- Create type for booking update input
CREATE TYPE public.booking_update_input AS (
  id uuid,
  guest_id uuid,
  payment_status_id uuid,
  room_ids uuid[],
  addon_ids uuid[],
  checkin_date date,
  checkout_date date,
  num_adults integer,
  num_children integer,
  amount decimal
);

-- Function to check room availability
CREATE OR REPLACE FUNCTION public.check_room_availability(
  p_room_ids uuid[],
  p_checkin_date date,
  p_checkout_date date,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE (
  room_id uuid,
  is_available boolean,
  conflicting_booking_id uuid,
  conflicting_dates text
) AS $$
BEGIN
  RETURN QUERY
  WITH room_status AS (
    SELECT 
      r.id AS room_id,
      s.status_name,
      br.booking_id,
      b.checkin_date,
      b.checkout_date
    FROM room r
    JOIN status s ON r.status_id = s.id
    LEFT JOIN booking_room br ON r.id = br.room_id
    LEFT JOIN booking b ON br.booking_id = b.id
    WHERE r.id = ANY(p_room_ids)
    AND (p_exclude_booking_id IS NULL OR br.booking_id != p_exclude_booking_id)
  )
  SELECT 
    rs.room_id,
    CASE 
      WHEN rs.status_name != 'available' THEN false
      WHEN rs.booking_id IS NOT NULL AND (
        (p_checkin_date >= rs.checkin_date AND p_checkin_date < rs.checkout_date) OR
        (p_checkout_date > rs.checkin_date AND p_checkout_date <= rs.checkout_date) OR
        (p_checkin_date <= rs.checkin_date AND p_checkout_date >= rs.checkout_date)
      ) THEN false
      ELSE true
    END AS is_available,
    rs.booking_id AS conflicting_booking_id,
    CASE 
      WHEN rs.booking_id IS NOT NULL THEN 
        'Booked from ' || rs.checkin_date::text || ' to ' || rs.checkout_date::text
      ELSE NULL
    END AS conflicting_dates
  FROM room_status rs;
END;
$$ LANGUAGE plpgsql;

-- Function to create multiple bookings
CREATE OR REPLACE FUNCTION public.create_bookings(
  bookings booking_input[]
)
RETURNS SETOF booking AS $$
DECLARE
  booking_input booking_input;
  new_booking_id uuid;
  room_id uuid;
  addon_id uuid;
  availability_check record;
  unavailable_rooms text[];
BEGIN
  -- Process each booking
  FOREACH booking_input IN ARRAY bookings
  LOOP
    -- Check room availability
    unavailable_rooms := ARRAY[]::text[];
    FOR availability_check IN 
      SELECT * FROM check_room_availability(
        booking_input.room_ids,
        booking_input.checkin_date,
        booking_input.checkout_date
      )
    LOOP
      IF NOT availability_check.is_available THEN
        unavailable_rooms := array_append(
          unavailable_rooms,
          'Room ' || availability_check.room_id || ': ' || availability_check.conflicting_dates
        );
      END IF;
    END LOOP;

    IF array_length(unavailable_rooms, 1) > 0 THEN
      RAISE EXCEPTION 'Some rooms are not available: %', array_to_string(unavailable_rooms, ', ');
    END IF;

    -- Create booking
    INSERT INTO booking (
      guest_id,
      payment_status_id,
      checkin_date,
      checkout_date,
      num_adults,
      num_children,
      amount
    ) VALUES (
      booking_input.guest_id,
      booking_input.payment_status_id,
      booking_input.checkin_date,
      booking_input.checkout_date,
      booking_input.num_adults,
      booking_input.num_children,
      booking_input.amount
    )
    RETURNING id INTO new_booking_id;

    -- Create booking rooms
    FOREACH room_id IN ARRAY booking_input.room_ids
    LOOP
      INSERT INTO booking_room (booking_id, room_id)
      VALUES (new_booking_id, room_id);
    END LOOP;

    -- Create booking addons if any
    IF booking_input.addon_ids IS NOT NULL THEN
      FOREACH addon_id IN ARRAY booking_input.addon_ids
      LOOP
        INSERT INTO booking_addon (booking_id, addon_id)
        VALUES (new_booking_id, addon_id);
      END LOOP;
    END IF;

    RETURN QUERY SELECT * FROM booking WHERE id = new_booking_id;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to update multiple bookings
CREATE OR REPLACE FUNCTION public.update_bookings(
  bookings booking_update_input[]
)
RETURNS SETOF booking AS $$
DECLARE
  booking_update booking_update_input;
  availability_check record;
  unavailable_rooms text[];
  room_id uuid;
  addon_id uuid;
BEGIN
  -- Process each booking update
  FOREACH booking_update IN ARRAY bookings
  LOOP
    -- Check if booking exists
    IF NOT EXISTS (SELECT 1 FROM booking WHERE id = booking_update.id) THEN
      RAISE EXCEPTION 'Booking % not found', booking_update.id;
    END IF;

    -- If rooms are being updated, check availability
    IF booking_update.room_ids IS NOT NULL THEN
      unavailable_rooms := ARRAY[]::text[];
      FOR availability_check IN 
        SELECT * FROM check_room_availability(
          booking_update.room_ids,
          COALESCE(booking_update.checkin_date, (SELECT checkin_date FROM booking WHERE id = booking_update.id)),
          COALESCE(booking_update.checkout_date, (SELECT checkout_date FROM booking WHERE id = booking_update.id)),
          booking_update.id
        )
      LOOP
        IF NOT availability_check.is_available THEN
          unavailable_rooms := array_append(
            unavailable_rooms,
            'Room ' || availability_check.room_id || ': ' || availability_check.conflicting_dates
          );
        END IF;
      END LOOP;

      IF array_length(unavailable_rooms, 1) > 0 THEN
        RAISE EXCEPTION 'Some rooms are not available for booking %: %', booking_update.id, array_to_string(unavailable_rooms, ', ');
      END IF;

      -- Update booking rooms
      DELETE FROM booking_room WHERE booking_id = booking_update.id;
      
      FOREACH room_id IN ARRAY booking_update.room_ids
      LOOP
        INSERT INTO booking_room (booking_id, room_id)
        VALUES (booking_update.id, room_id);
      END LOOP;
    END IF;

    -- If addons are being updated
    IF booking_update.addon_ids IS NOT NULL THEN
      -- Update booking addons
      DELETE FROM booking_addon WHERE booking_id = booking_update.id;
      
      FOREACH addon_id IN ARRAY booking_update.addon_ids
      LOOP
        INSERT INTO booking_addon (booking_id, addon_id)
        VALUES (booking_update.id, addon_id);
      END LOOP;
    END IF;

    -- Update booking
    UPDATE booking
    SET
      guest_id = COALESCE(booking_update.guest_id, guest_id),
      payment_status_id = COALESCE(booking_update.payment_status_id, payment_status_id),
      checkin_date = COALESCE(booking_update.checkin_date, checkin_date),
      checkout_date = COALESCE(booking_update.checkout_date, checkout_date),
      num_adults = COALESCE(booking_update.num_adults, num_adults),
      num_children = COALESCE(booking_update.num_children, num_children),
      amount = COALESCE(booking_update.amount, amount),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = booking_update.id;

    RETURN QUERY SELECT * FROM booking WHERE id = booking_update.id;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;
