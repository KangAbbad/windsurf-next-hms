This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Prompts:

Build fullstack dashboard for hotel management system with tech stack:

- next js 15
- supabase
- ant design
- typescript

Table requirements for a hotel booking system:

1. **Entities and Attributes**:

   - **Guest**:
     - Primary Key: `id` (unique identifier for each guest)
     - Attributes:
       - `nationality` (enum with values: `FOREIGNER`, `LOCAL_CITIZEN`)
       - `id_card_type` (enum with values: `NATIONAL_IDENTITY_CARD`, `PASSPORT`, `PERMANENT_RESIDENCE_PERMIT`, `TEMPORARY_STAY_PERMIT`, `DRIVING_LICENSE`)
       - `id_card_number` (unique identifier for the guest's ID card)
       - `name` (full name of the guest)
       - `phone` (contact number of the guest)
       - `email` (email address of the guest)
       - `address` (residential address of the guest)
       - `created_at` (timestamp when the record was created)
       - `updated_at` (timestamp when the record was last updated)
   - **Booking**:
     - Primary Key: `id` (unique identifier for each booking)
     - Foreign Keys: `payment_status_id` (references Payment_Status)
     - Attributes:
       - `checkin_date`
       - `checkout_date`
       - `num_adults`
       - `num_children`
       - `amount` (total amount associated with the booking)
       - `created_at`
       - `updated_at`
   - **Booking_Guest** (junction table for Booking and Guest):
     - Foreign Keys: `booking_id` (references Booking), `guest_id` (references Guest)
     - Attributes:
       - `is_primary` (boolean to indicate if the guest is the primary contact for the booking, e.g., true/false)
       - `created_at`
       - `updated_at`
   - **Payment_Status**:
     - Primary Key: `id` (unique identifier for payment status)
     - Attributes:
       - `number` (unique identifier or order for the status, e.g., 1, 2, 3)
       - `name` (e.g., "Pending", "Completed", "Failed")
       - `color` (hex code for UI representation, e.g., "#FF0000" for red)
       - `created_at`
       - `updated_at`
   - **Booking_Room** (junction table for Booking and Room):
     - Foreign Keys: `booking_id` (references Booking), `room_id` (references Room)
     - Attributes: `created_at`, `updated_at`
   - **Room**:
     - Primary Key: `id` (unique identifier for each room)
     - Foreign Keys: `floor_id` (references Floor), `room_class_id` (references Room_Class), `room_status_id` (references Room_Status)
     - Attributes:
       - `number` (unique identifier for the room within the floor, e.g., "101", "102")
       - `created_at`
       - `updated_at`
   - **Floor**:
     - Primary Key: `id` (unique identifier for each floor)
     - Attributes:
       - `number` (numeric identifier for the floor, e.g., 1, 2, 3)
       - `name` (descriptive name for the floor, e.g., "Ground Floor", "First Floor")
       - `created_at`
       - `updated_at`
   - **Room_Class**:
     - Primary Key: `id` (unique identifier for room class)
     - Attributes:
       - `name` (e.g., "Standard", "Deluxe")
       - `price` (base price for the room class)
       - `image_url` (URL to an image representing the room class, e.g., "https://example.com/image.jpg")
       - `created_at`
       - `updated_at`
   - **Bed_Type**:
     - Primary Key: `id` (unique identifier for bed type)
     - Attributes:
       - `name` (e.g., "King", "Queen", "Twin")
       - `height` (height of the bed in centimeters, e.g., 30)
       - `width` (width of the bed in centimeters, e.g., 180)
       - `length` (length of the bed in centimeters, e.g., 200)
       - `material` (material of the bed, e.g., "Wood", "Metal")
       - `image_url` (URL to an image representing the bed type, e.g., "https://example.com/bed.jpg")
       - `created_at`
       - `updated_at`
   - **Room_Class_Bed_Type** (junction table for Room_Class and Bed_Type):
     - Foreign Keys: `room_class_id` (references Room_Class), `bed_type_id` (references Bed_Type)
     - Attributes:
       - `num_beds` (number of beds of this type in the room class, e.g., 1 for 1 King bed)
       - `created_at`
       - `updated_at`
   - **Room_Class_Feature** (junction table for Room_Class and Feature):
     - Foreign Keys: `room_class_id` (references Room_Class), `feature_id` (references Feature)
     - Attributes: `created_at`, `updated_at`
   - **Feature**:
     - Primary Key: `id` (unique identifier for each feature)
     - Attributes:
       - `name` (e.g., "Wi-Fi", "Balcony", "Mini-Bar")
       - `price` (cost associated with the feature, e.g., 10 for Wi-Fi access)
       - `image_url` (URL to an image representing the feature, e.g., "https://example.com/feature.jpg")
       - `created_at`
       - `updated_at`
   - **Room_Status**:
     - Primary Key: `id` (unique identifier for room status)
     - Attributes:
       - `number` (unique identifier or order for the status, e.g., 1 for "Available", 2 for "Occupied")
       - `name` (e.g., "Available", "Occupied", "Maintenance")
       - `color` (hex code for UI representation, e.g., "#00FF00" for green)
       - `created_at`
       - `updated_at`
   - **Booking_Addon** (junction table for Booking and Addon):
     - Foreign Keys: `booking_id` (references Booking), `addon_id` (references Addon)
     - Attributes: `created_at`, `updated_at`
   - **Addon**:
     - Primary Key: `id` (unique identifier for each addon)
     - Attributes:
       - `name` (e.g., "Breakfast", "Spa Package")
       - `price` (cost associated with the addon, e.g., 15 for Breakfast)
       - `image_url` (URL to an image representing the addon, e.g., "https://example.com/addon.jpg")
       - `created_at`
       - `updated_at`

2. **Relationships**:

   - A **Booking** can have multiple **Guests**, and a **Guest** can be associated with multiple **Bookings** through the **Booking_Guest** junction table (many-to-many). Each **Booking_Guest** record links a `booking_id` to a `guest_id` and includes an `is_primary` flag to indicate the primary guest for the booking.
   - A **Booking** has a **Payment_Status** (many-to-one). Each **Booking** is linked to one \*\*Payment_Status`via`payment_status_id`.
   - A **Booking** can be associated with multiple **Rooms** through the **Booking_Room** junction table (many-to-many). Each **Booking_Room** record links a `booking_id` to a `room_id`.
   - A **Room** belongs to one **Floor** (many-to-one). Each **Room** is linked to a **Floor** via `floor_id`.
   - A **Room** belongs to one **Room_Class** (many-to-one). Each **Room** is linked to a \*\*Room_Class`via`room_class_id`.
   - A **Room** has a **Room_Status** (many-to-one). Each **Room** is linked to a \*\*Room_Status`via`room_status_id`.
   - A **Room_Class** can have multiple **Bed_Types** through the **Room_Class_Bed_Type** junction table (many-to-many). Each **Room_Class_Bed_Type** record links a `room_class_id` to a `bed_type_id` and includes a `num_beds` attribute to specify the quantity of that bed type in the room class.
   - A **Room_Class** can have multiple **Features** through the **Room_Class_Feature** junction table (many-to-many). Each **Room_Class_Feature** record links a `room_class_id` to a `feature_id`.
   - A **Booking** can have multiple **Addons** through the **Booking_Addon** junction table (many-to-many). Each **Booking_Addon** record links a `booking_id` to an `addon_id`.

3. **ERD Design Guidelines**:

   - Use boxes to represent each entity.
   - List the primary key (PK) and foreign keys (FK) explicitly in each entity box.
   - Show relationships between entities using lines with appropriate cardinality (e.g., one-to-many, many-to-many).
   - Use junction tables (e.g., `Booking_Guest`, `Booking_Room`, `Room_Class_Bed_Type`, `Room_Class_Feature`, `Booking_Addon`) to handle many-to-many relationships.
   - Ensure that foreign keys are clearly indicated and point to the correct primary keys in related tables.
   - Include `created_at` and `updated_at` as the last attributes in each entity for consistency.

4. **Additional Notes**:
   - The `created_at` and `updated_at` fields should be timestamps (e.g., in a format like `YYYY-MM-DD HH:MM:SS`).
   - The `is_primary` field in the **Booking_Guest** table should be a boolean (e.g., `true` for the primary guest, `false` for others). Ensure that only one guest per booking is marked as the primary guest.
   - The `nationality` and `id_card_type` fields in the **Guest** table should be defined as enums with the specified values.
   - The `id_card_number` in the **Guest** table should be unique to avoid duplicate identification for guests.
   - The `number` field in the **Payment_Status** and **Room_Status** tables should be unique to ensure each status has a distinct identifier or order.
   - The `color` field in the **Payment_Status** and **Room_Status** tables should store a hex code (e.g., "#FF0000" for red, "#00FF00" for green) for use in UI rendering.
   - The `number` field in the **Room** table should be unique within the context of its `floor_id` to avoid duplicate room numbers on the same floor (e.g., Room 101 on Floor 1 and Room 101 on Floor 2 are distinct).
   - The `number` field in the **Floor** table should be unique to ensure each floor has a distinct numeric identifier (e.g., 1, 2, 3).
   - The `name` field in the **Floor** table should be unique to avoid duplicate floor names (e.g., "Ground Floor", "First Floor").
   - The `image_url` field in the **Room_Class**, **Bed_Type**, **Feature**, and **Addon** tables should store a valid URL to an image (e.g., "https://example.com/image.jpg").
   - The `height`, `width`, and `length` fields in the **Bed_Type** table should store measurements in a consistent unit (e.g., centimeters), such as 30 cm for height, 180 cm for width, and 200 cm for length.
   - The `material` field in the **Bed_Type** table should store the material of the bed (e.g., "Wood", "Metal").
   - The `price` field in the **Feature** and **Addon** tables should store the cost associated with the feature or addon (e.g., 10 for Wi-Fi, 15 for Breakfast). If a feature or addon is free, the price can be set to 0.
   - The `num_beds` field in the **Room_Class_Bed_Type** table should be a positive integer (e.g., 1 for 1 King bed, 2 for 2 Twin beds) to indicate the number of beds of a specific type in the room class.
   - The ERD should be clean and organized, with entities grouped logically (e.g., guest-related entities on the left, room-related entities on the right).
   - Use consistent naming conventions for entities and attributes (e.g., snake_case for attribute names like `nationality`, `created_at`).
   - Ensure that all relationships are properly connected with arrows indicating the direction of the relationship (e.g., from foreign key to primary key).
