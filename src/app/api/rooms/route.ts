import { NextResponse } from 'next/server'

import { createClient } from '@/providers/supabase/server'
import type { CreateRoomInput, Room, RoomResponse } from '@/types/room'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room').select(
      `
        id,
        room_number,
        room_class_id,
        room_status_id,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          room_class_name,
          description,
          base_occupancy,
          max_occupancy,
          base_rate,
          features:room_class_feature(
            feature:feature(
              id,
              feature_name
            )
          ),
          bed_types:room_class_bed_type(
            bed_type:bed_type(
              id,
              bed_type_name
            ),
            quantity
          )
        ),
        room_status:room_status(
          id,
          status_name,
          description,
          is_available,
          color_code
        )
      `,
      { count: 'exact' }
    )

    // Apply search filter if provided
    if (search) {
      query = query.ilike('room_number', `%${search}%`)
    }

    const {
      data: rooms,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('room_number', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const response: RoomResponse = {
      rooms: (rooms || []) as Room[],
      pagination: {
        total: count,
        page,
        limit,
        total_pages: count ? Math.ceil(count / limit) : null,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const newRoom: CreateRoomInput = {
      room_number: body.room_number,
      room_class_id: body.room_class_id,
      room_status_id: body.room_status_id,
    }

    // Validate required fields
    const validationErrors: string[] = []
    if (!newRoom.room_number) validationErrors.push('room_number is required')
    if (!newRoom.room_class_id) validationErrors.push('room_class_id is required')
    if (!newRoom.room_status_id) validationErrors.push('room_status_id is required')

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: 'Missing required fields', errors: validationErrors }, { status: 400 })
    }

    // Check if room number already exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('room')
      .select('id')
      .ilike('room_number', newRoom.room_number)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: checkError.message }, { status: 400 })
    }

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room number already exists', errors: ['Room number must be unique'] },
        { status: 400 }
      )
    }

    // Check if room class exists
    const { data: roomClass, error: roomClassError } = await supabase
      .from('room_class')
      .select('id')
      .eq('id', newRoom.room_class_id)
      .single()

    if (roomClassError || !roomClass) {
      return NextResponse.json({ error: 'Room class not found', errors: ['Invalid room_class_id'] }, { status: 404 })
    }

    // Check if room status exists
    const { data: roomStatus, error: roomStatusError } = await supabase
      .from('room_status')
      .select('id')
      .eq('id', newRoom.room_status_id)
      .single()

    if (roomStatusError || !roomStatus) {
      return NextResponse.json({ error: 'Room status not found', errors: ['Invalid room_status_id'] }, { status: 404 })
    }

    // Create room
    const { data: created, error: createError } = await supabase
      .from('room')
      .insert([newRoom])
      .select(
        `
        id,
        room_number,
        room_class_id,
        room_status_id,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          room_class_name,
          description,
          base_occupancy,
          max_occupancy,
          base_rate,
          features:room_class_feature(
            feature:feature(
              id,
              feature_name
            )
          ),
          bed_types:room_class_bed_type(
            bed_type:bed_type(
              id,
              bed_type_name
            ),
            quantity
          )
        ),
        room_status:room_status(
          id,
          status_name,
          description,
          is_available,
          color_code
        )
      `
      )
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    return NextResponse.json(created)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
