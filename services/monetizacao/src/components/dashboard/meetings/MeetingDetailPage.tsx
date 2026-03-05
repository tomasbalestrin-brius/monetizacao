import { useState } from 'react';
import { Meeting, useMeetingParticipants, useUpdateMeeting, useDeleteMeeting } from '@/hooks/useMeetings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MeetingNotes } from './MeetingNotes';
import { ActionItems } from './ActionItems';
import { ArrowLeft, Calendar, Clock, Users, CheckCircle, XCircle, Pencil, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@bethel/shared-auth';

interface MeetingDetailPageProps {
  meeting: Meeting;
  onBack: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  completed: { label: 'Concluída', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export function MeetingDetailPage({ meeting, onBack }: MeetingDetailPageProps) {
  const { isAdminOrLider } = useAuth();
  const { data: participants = [] } = useMeetingParticipants(meeting.id);
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(meeting.title);
  const [editDescription, setEditDescription] = useState(meeting.description);
  const [editDate, setEditDate] = useState(meeting.meeting_date.split('T')[0]);
  const [editTime, setEditTime] = useState(format(new Date(meeting.meeting_date), 'HH:mm'));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = statusConfig[meeting.status] || statusConfig.scheduled;
  const meetingDate = new Date(meeting.meeting_date);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateMeeting.mutateAsync({ id: meeting.id, status: newStatus });
      toast.success(`Reunião marcada como ${statusConfig[newStatus]?.label.toLowerCase()}`);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const meeting_date = new Date(`${editDate}T${editTime}`).toISOString();
      await updateMeeting.mutateAsync({
        id: meeting.id,
        title: editTitle,
        description: editDescription,
        meeting_date,
      });
      toast.success('Reunião atualizada');
      setEditing(false);
    } catch {
      toast.error('Erro ao atualizar reunião');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMeeting.mutateAsync(meeting.id);
      toast.success('Reunião excluída');
      onBack();
    } catch {
      toast.error('Erro ao excluir reunião');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold"
            />
          ) : (
            <h1 className="text-xl font-bold truncate">{meeting.title}</h1>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge variant="outline" className={status.color}>{status.label}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(meetingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(meetingDate, 'HH:mm')}
            </span>
          </div>
        </div>

        {/* Edit/Delete buttons for admin/lider */}
        {isAdminOrLider && !editing && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          </div>
        )}
        {editing && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={handleSaveEdit} disabled={updateMeeting.isPending}>
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium mb-3">
            Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteMeeting.isPending}>
              Confirmar Exclusão
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Edit fields */}
      {editing && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="actions">Plano de Ação</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          {meeting.description && !editing && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Descrição</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{meeting.description}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Participantes ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <ul className="space-y-1">
                  {participants.map((p) => (
                    <li key={p.id} className="text-sm text-muted-foreground">{p.profiles?.email || p.user_id}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum participante</p>
              )}
            </CardContent>
          </Card>

          {meeting.status === 'scheduled' && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleStatusChange('completed')}>
                <CheckCircle className="h-4 w-4 mr-2" /> Marcar como Concluída
              </Button>
              <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleStatusChange('cancelled')}>
                <XCircle className="h-4 w-4 mr-2" /> Cancelar Reunião
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <ActionItems meetingId={meeting.id} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <MeetingNotes meetingId={meeting.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
