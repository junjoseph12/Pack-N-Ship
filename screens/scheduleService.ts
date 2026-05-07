import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { ScheduleState } from './ScheduleContext';

export async function saveScheduleToDB(state: ScheduleState) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Try to get the existing public.users record
  let { data: userRecord, error: userErr } = await supabase
    .from('users')
    .select('user_id')
    .eq('auth_id', user.id)
    .maybeSingle();

  // 2. If no record exists, create one (requires RLS policy – see below)
  if (!userRecord) {
    const metadata = user.user_metadata || {};
    const email = user.email || '';
    const firstName = metadata.first_name || 'First';
    const lastName = metadata.last_name || 'Last';
    const phone = metadata.phone_number || '';

    const { data: newUser, error: createErr } = await supabase
      .from('users')
      .insert({
        auth_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone,
        is_verified: false,
        is_active: true,
      })
      .select()
      .single();

    if (createErr) {
      if (createErr.code === '42501') {
        Alert.alert(
          'Account Setup Required',
          'Row-Level Security is blocking user creation. Please run the SQL policy in Supabase (see instructions).'
        );
        throw new Error('RLS policy prevents user insert.');
      }
      console.error('Failed to create user record:', createErr);
      throw new Error('Could not create user record');
    }
    userRecord = newUser;
  }

  const dbUserId = userRecord.user_id;

  // 3. Insert pickup location
  const { data: pickupLoc } = await supabase
    .from('locations')
    .insert({
      street_address: state.pickupLocation!.address,
      barangay: '',
      city: '',
      province: '',
      zip_code: '',
      latitude: state.pickupLocation!.latitude,
      longitude: state.pickupLocation!.longitude,
    })
    .select()
    .single();

  // 4. Insert dropoff location
  const { data: dropoffLoc } = await supabase
    .from('locations')
    .insert({
      street_address: state.dropoffLocation!.address,
      barangay: '',
      city: '',
      province: '',
      zip_code: '',
      latitude: state.dropoffLocation!.latitude,
      longitude: state.dropoffLocation!.longitude,
    })
    .select()
    .single();

  // 5. Insert cargo profile
  const smallQty = state.items.filter((i) => i.size === 'Small').length;
  const mediumQty = state.items.filter((i) => i.size === 'Medium').length;
  const largeQty = state.items.filter((i) => i.size === 'Large').length;
  const isFragile = state.items.some((i) => i.fragile);
  const totalWeight = smallQty * 5 + mediumQty * 15 + largeQty * 30;
  const cargoPic = state.items.length > 0 ? state.items[0].photoUri : null;

  const { data: cargo } = await supabase
    .from('cargo_profiles')
    .insert({
      description: state.items.map((i) => i.description).join(', '),
      cargo_pic: cargoPic,
      total_weight_kg: totalWeight,
      small_box_qty: smallQty,
      medium_box_qty: mediumQty,
      large_box_qty: largeQty,
      is_fragile: isFragile,
      sender_id: dbUserId,
    })
    .select()
    .single();

  // 6. Get a delivery rate (first available)
  const { data: rate } = await supabase
    .from('delivery_rates')
    .select('rate_id')
    .limit(1)
    .single();

  // 7. Create the delivery request
  const { data: request } = await supabase
    .from('delivery_requests')
    .insert({
      pickup_type: state.dropoffType,
      scheduled_time: state.scheduledDate ? state.scheduledDate.toISOString() : null,
      delivery_status: 'Pending',
      receiver_phone: '09171234567',   // placeholder – you'll add proper input later
      total_distance: 5.0,             // placeholder – compute real distance if needed
      estimated_cost: state.estimatedCost,
      dropoff_location_id: dropoffLoc!.location_id,
      pickup_location_id: pickupLoc!.location_id,
      rate_id: rate!.rate_id,
      sender_id: dbUserId,
      cargo_id: cargo!.cargo_id,
    })
    .select()
    .single();

  return request;
}