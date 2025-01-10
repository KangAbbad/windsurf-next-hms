import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type {
  CreateRoomClassBedTypeBody,
  RoomClassBedTypeListItem,
  UpdateRoomClassBedTypeBody,
} from '@/types/room-class-bed-type'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const roomClassId = searchParams.get('room_class_id')
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room_class_bed_type').select(
      `
        room_class_id,
        bed_type_id,
        num_beds,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          class_name
        ),
        bed_type:bed_type(
          id,
          bed_type_name
        )
      `,
      { count: 'exact' }
    ) as unknown as any

    // Filter by room class if provided
    if (roomClassId) {
      query = query.eq('room_class_id', roomClassId)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<RoomClassBedTypeListItem> = {
      items: items || [],
      meta: {
        total: count,
        page,
        limit,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed types retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get room class bed types error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const newRoomClassBedType: CreateRoomClassBedTypeBody = await request.json()
    const { room_class_id, bed_type_id, num_beds } = newRoomClassBedType

    // Validate required fields
    const validationErrors: string[] = []
    if (!room_class_id) validationErrors.push('room_class_id is required')
    if (!bed_type_id) validationErrors.push('bed_type_id is required')
    if (!num_beds) validationErrors.push('num_beds is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if room class exists
    const { data: roomClass, error: roomClassError } = await supabase
      .from('room_class')
      .select('id')
      .eq('id', room_class_id)
      .single()

    if (roomClassError || !roomClass) {
      return createErrorResponse({
        code: 404,
        message: 'Room class not found',
        errors: ['Invalid room_class_id'],
      })
    }

    // Check if bed type exists
    const { data: bedType, error: bedTypeError } = await supabase
      .from('bed_type')
      .select('id')
      .eq('id', bed_type_id)
      .single()

    if (bedTypeError || !bedType) {
      return createErrorResponse({
        code: 404,
        message: 'Bed type not found',
        errors: ['Invalid bed_type_id'],
      })
    }

    // Check if relationship already exists
    const { data: existingRelation, error: existingError } = await supabase
      .from('room_class_bed_type')
      .select('id')
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking existing relationship',
        errors: [existingError.message],
      })
    }

    if (existingRelation) {
      return createErrorResponse({
        code: 400,
        message: 'Relationship already exists',
        errors: ['This bed type is already assigned to the room class'],
      })
    }

    // Create the relationship
    const { data: created, error: createError } = await supabase
      .from('room_class_bed_type')
      .insert({
        room_class_id,
        bed_type_id,
        num_beds,
      })
      .select(
        `
        id,
        room_class_id,
        bed_type_id,
        num_beds,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          class_name
        ),
        bed_type:bed_type(
          id,
          bed_type_name
        )
      `
      )
      .single()

    if (createError) {
      return createErrorResponse({
        code: 400,
        message: createError.message,
        errors: [createError.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room class bed type created successfully',
      data: created,
    })
  } catch (error) {
    console.error('Create room class bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const updateData: UpdateRoomClassBedTypeBody = await request.json()
    const { room_class_id, bed_type_id, num_beds } = updateData

    const validationErrors: string[] = []
    if (!room_class_id) validationErrors.push('room_class_id is required')
    if (!bed_type_id) validationErrors.push('bed_type_id is required')
    if (!num_beds) validationErrors.push('num_beds is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if record exists
    const { error: findError } = await supabase
      .from('room_class_bed_type')
      .select()
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)
      .single()

    if (findError) {
      return createErrorResponse({
        code: 404,
        message: 'Record not found',
        errors: [findError.message],
      })
    }

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('room_class_bed_type')
      .update({ num_beds })
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)
      .select(
        `
        room_class_id,
        bed_type_id,
        num_beds,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          class_name
        ),
        bed_type:bed_type(
          id,
          bed_type_name
        )
      `
      )
      .single()

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: updateError.message,
        errors: [updateError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed type updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Update room class bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['id is required'],
      })
    }

    // Check if record exists and get its details
    const { data: roomClassBedType, error: checkError } = await supabase
      .from('room_class_bed_type')
      .select('id, room_class_id, bed_type_id')
      .eq('id', id)
      .single()

    if (checkError) {
      return createErrorResponse({
        code: 404,
        message: 'Room class bed type not found',
        errors: ['Invalid room class bed type ID'],
      })
    }

    // Check if any room is using this room class bed type
    const { data: rooms, error: roomError } = await supabase
      .from('room')
      .select('id')
      .eq('room_class_id', roomClassBedType.room_class_id)
      .limit(1)
      .single()

    if (roomError && roomError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking room usage',
        errors: [roomError.message],
      })
    }

    if (rooms) {
      return createErrorResponse({
        code: 400,
        message: 'Room class bed type in use',
        errors: ['Cannot delete room class bed type that is being used by rooms'],
      })
    }

    // Delete the record
    const { error: deleteError } = await supabase.from('room_class_bed_type').delete().eq('id', id)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: deleteError.message,
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed type deleted successfully',
    })
  } catch (error) {
    console.error('Delete room class bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
