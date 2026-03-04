import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppointmentWithLead {
  id: string;
  lead_id: string;
  sdr_id: string | null;
  closer_id: string | null;
  funnel_id: string | null;
  qualification: string | null;
  scheduled_date: string;
  duration: number;
  timezone: string;
  status: 'agendado' | 'reagendado' | 'realizado' | 'nao_compareceu' | 'cancelado';
  reschedule_count: number;
  attended: boolean | null;
  converted: boolean | null;
  conversion_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined lead data
  lead: {
    full_name: string;
    phone: string | null;
    email: string | null;
    instagram: string | null;
    niche: string | null;
    main_pain: string | null;
    revenue: number | null;
    classification: string | null;
    qualification: string | null;
  } | null;
  // Joined funnel data
  funnel: {
    name: string;
  } | null;
  // SDR profile
  sdr_profile: {
    name: string | null;
    email: string;
  } | null;
  // Closer profile
  closer_profile: {
    name: string | null;
    email: string;
  } | null;
}

interface UseAppointmentsOptions {
  closerId?: string; // Filter by specific closer (for admin/lider)
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
  status?: string[];
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { user, isCloser } = useAuth();

  return useQuery({
    queryKey: ['appointments', options, user?.id],
    queryFn: async (): Promise<AppointmentWithLead[]> => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          lead:leads(full_name, phone, email, instagram, niche, main_pain, revenue, classification, qualification),
          funnel:funnels(name),
          sdr_profile:profiles!appointments_sdr_id_fkey(name, email),
          closer_profile:profiles!appointments_closer_id_fkey(name, email)
        `)
        .order('scheduled_date', { ascending: true });

      // Closer only sees their own appointments (enforced by RLS too)
      if (isCloser && user) {
        query = query.eq('closer_id', user.id);
      } else if (options.closerId) {
        query = query.eq('closer_id', options.closerId);
      }

      if (options.dateFrom) {
        query = query.gte('scheduled_date', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('scheduled_date', options.dateTo);
      }

      if (options.status && options.status.length > 0) {
        query = query.in('status', options.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as unknown as AppointmentWithLead[];
    },
    enabled: !!user,
  });
}

export function useTodayAppointments(closerId?: string) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  return useAppointments({
    closerId,
    dateFrom: startOfDay,
    dateTo: endOfDay,
  });
}

export function useWeekAppointments(closerId?: string) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);

  return useAppointments({
    closerId,
    dateFrom: startOfWeek.toISOString(),
    dateTo: endOfWeek.toISOString(),
  });
}

// Register call result
interface RegisterCallResultInput {
  appointmentId: string;
  attended: boolean;
  converted?: boolean;
  conversionValue?: number;
  notes?: string;
}

export function useRegisterCallResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterCallResultInput) => {
      const status = input.attended ? 'realizado' : 'nao_compareceu';

      const { data, error } = await supabase
        .from('appointments')
        .update({
          status,
          attended: input.attended,
          converted: input.converted ?? null,
          conversion_value: input.conversionValue ?? null,
          notes: input.notes ?? null,
        })
        .eq('id', input.appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelado' as const })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Reschedule appointment
interface RescheduleInput {
  appointmentId: string;
  newDate: string;
  notes?: string;
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RescheduleInput) => {
      // First get current reschedule count
      const { data: current, error: fetchError } = await supabase
        .from('appointments')
        .select('reschedule_count')
        .eq('id', input.appointmentId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('appointments')
        .update({
          scheduled_date: input.newDate,
          status: 'reagendado' as const,
          reschedule_count: (current?.reschedule_count ?? 0) + 1,
          notes: input.notes ?? null,
        })
        .eq('id', input.appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Fetch closers list (for admin/lider filter)
export function useClosersList() {
  return useQuery({
    queryKey: ['closers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, squad_id')
        .eq('active', true);

      if (error) throw error;

      // Filter to only users with 'closer' role
      // We need to join with user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['closer', 'user']); // 'user' is legacy for 'closer'

      if (roleError) throw roleError;

      const closerUserIds = new Set(roleData?.map(r => r.user_id) ?? []);
      return (data ?? []).filter(p => closerUserIds.has(p.id));
    },
  });
}
