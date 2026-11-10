import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, ClipboardList, Plus, Trash2, X } from 'lucide-react';

type Application = { id: string; company: string; jobTitle: string };
type Note = { id: string; content: string; createdAt?: string };
type Interview = {
  id: string;
  scheduledAt: string;
  type?: string;
  interviewer?: string;
  meetingUrl?: string;
  notes?: string;
  completed?: boolean;
};
type Reminder = {
  id: string;
  title: string;
  remindAt: string;
  completed?: boolean;
};

type RequestFunction = <T,>(path: string, options?: RequestInit) => Promise<T>;

type Props = {
  application: Application;
  request: RequestFunction;
  onClose: () => void;
  onMessage: (message: string) => void;
};

const interviewTypes = ['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'HR', 'OTHER'];

export default function ApplicationDetails({ application, request, onClose, onMessage }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [noteText, setNoteText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewType, setInterviewType] = useState('VIDEO');
  const [interviewer, setInterviewer] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [loading, setLoading] = useState(true);

  const base = `/applications/${application.id}`;

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [noteItems, interviewItems, reminderItems] = await Promise.all([
        request<Note[]>(`${base}/notes`),
        request<Interview[]>(`${base}/interviews`),
        request<Reminder[]>(`${base}/reminders`)
      ]);
      setNotes(noteItems || []);
      setInterviews(interviewItems || []);
      setReminders(reminderItems || []);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not load application details.');
    } finally {
      setLoading(false);
    }
  }, [base, onMessage, request]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  async function addNote(event: FormEvent) {
    event.preventDefault();
    try {
      await request(`${base}/notes`, { method: 'POST', body: JSON.stringify({ content: noteText }) });
      setNoteText('');
      await loadDetails();
      onMessage('Note added.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not add note.');
    }
  }

  async function addInterview(event: FormEvent) {
    event.preventDefault();
    try {
      await request(`${base}/interviews`, {
        method: 'POST',
        body: JSON.stringify({
          scheduledAt,
          type: interviewType,
          interviewer: interviewer || null,
          meetingUrl: meetingUrl || null,
          notes: interviewNotes || null
        })
      });
      setScheduledAt('');
      setInterviewer('');
      setMeetingUrl('');
      setInterviewNotes('');
      await loadDetails();
      onMessage('Interview added.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not add interview.');
    }
  }

  async function addReminder(event: FormEvent) {
    event.preventDefault();
    try {
      await request(`${base}/reminders`, {
        method: 'POST',
        body: JSON.stringify({ title: reminderTitle, remindAt })
      });
      setReminderTitle('');
      setRemindAt('');
      await loadDetails();
      onMessage('Reminder added.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not add reminder.');
    }
  }

  async function setInterviewCompleted(interview: Interview) {
    try {
      await request(`${base}/interviews/${interview.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !interview.completed })
      });
      await loadDetails();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not update interview.');
    }
  }

  async function setReminderCompleted(reminder: Reminder) {
    try {
      await request(`${base}/reminders/${reminder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !reminder.completed })
      });
      await loadDetails();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not update reminder.');
    }
  }

  async function remove(path: string, label: string) {
    if (!window.confirm(`Delete this ${label.toLowerCase()}?`)) return;
    try {
      await request(path, { method: 'DELETE' });
      await loadDetails();
      onMessage(`${label} deleted.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : `Could not delete ${label.toLowerCase()}.`);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="details-title" onClick={event => event.stopPropagation()}>
        <header className="detail-header">
          <div>
            <p className="eyebrow"><ClipboardList size={14} /> APPLICATION DETAILS</p>
            <h2 id="details-title">{application.jobTitle}</h2>
            <p className="muted">{application.company}</p>
          </div>
          <button className="icon-button" aria-label="Close details" onClick={onClose}><X size={19} /></button>
        </header>

        {loading ? <p className="muted detail-loading">Loading application details…</p> : (
          <div className="detail-columns">
            <section className="detail-section">
              <div className="detail-section-title"><h3>Notes</h3><span>{notes.length}</span></div>
              <form className="detail-form" onSubmit={addNote}>
                <textarea value={noteText} onChange={event => setNoteText(event.target.value)} placeholder="Add a call summary, contact or next step…" required />
                <button className="primary-button" disabled={!noteText.trim()}><Plus size={15} /> Add note</button>
              </form>
              <div className="detail-items">
                {notes.length === 0 && <p className="empty-inline">No notes yet.</p>}
                {notes.map(note => (
                  <article className="detail-item" key={note.id}>
                    <p>{note.content}</p>
                    <button className="icon-button danger-icon" aria-label="Delete note" onClick={() => void remove(`${base}/notes/${note.id}`, 'Note')}><Trash2 size={14} /></button>
                  </article>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section-title"><h3>Interviews</h3><span>{interviews.length}</span></div>
              <form className="detail-form" onSubmit={addInterview}>
                <label>Date and time<input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} required /></label>
                <label>Interview type<select value={interviewType} onChange={event => setInterviewType(event.target.value)}>{interviewTypes.map(type => <option key={type}>{type}</option>)}</select></label>
                <label>Interviewer<input value={interviewer} onChange={event => setInterviewer(event.target.value)} placeholder="Name (optional)" /></label>
                <label>Meeting link<input type="url" value={meetingUrl} onChange={event => setMeetingUrl(event.target.value)} placeholder="https://" /></label>
                <label>Preparation notes<textarea rows={2} value={interviewNotes} onChange={event => setInterviewNotes(event.target.value)} /></label>
                <button className="primary-button" disabled={!scheduledAt}><Plus size={15} /> Add interview</button>
              </form>
              <div className="detail-items">
                {interviews.length === 0 && <p className="empty-inline">No interviews scheduled.</p>}
                {interviews.map(interview => (
                  <article className="detail-item stacked" key={interview.id}>
                    <div>
                      <strong>{new Date(interview.scheduledAt).toLocaleString()}</strong>
                      <p>{interview.type || 'Interview'}{interview.interviewer ? ` · ${interview.interviewer}` : ''}</p>
                      {interview.meetingUrl && <a href={interview.meetingUrl} target="_blank" rel="noreferrer">Meeting link</a>}
                      {interview.notes && <p>{interview.notes}</p>}
                    </div>
                    <div className="detail-item-actions">
                      <button className={`icon-button ${interview.completed ? 'completed-action' : ''}`} aria-label="Toggle interview completion" onClick={() => void setInterviewCompleted(interview)}><Check size={14} /></button>
                      <button className="icon-button danger-icon" aria-label="Delete interview" onClick={() => void remove(`${base}/interviews/${interview.id}`, 'Interview')}><Trash2 size={14} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section-title"><h3>Reminders</h3><span>{reminders.length}</span></div>
              <form className="detail-form" onSubmit={addReminder}>
                <label>Reminder<input value={reminderTitle} onChange={event => setReminderTitle(event.target.value)} placeholder="Follow up with recruiter" required /></label>
                <label>Date and time<input type="datetime-local" value={remindAt} onChange={event => setRemindAt(event.target.value)} required /></label>
                <button className="primary-button" disabled={!reminderTitle.trim() || !remindAt}><Plus size={15} /> Add reminder</button>
              </form>
              <div className="detail-items">
                {reminders.length === 0 && <p className="empty-inline">No reminders set.</p>}
                {reminders.map(reminder => (
                  <article className="detail-item stacked" key={reminder.id}>
                    <div>
                      <strong>{reminder.title}</strong>
                      <p><CalendarClock size={13} /> {new Date(reminder.remindAt).toLocaleString()}</p>
                      <span className={`reminder-state ${reminder.completed ? 'is-complete' : ''}`}>{reminder.completed ? 'Completed' : 'Upcoming'}</span>
                    </div>
                    <div className="detail-item-actions">
                      <button className={`icon-button ${reminder.completed ? 'completed-action' : ''}`} aria-label="Toggle reminder completion" onClick={() => void setReminderCompleted(reminder)}><Check size={14} /></button>
                      <button className="icon-button danger-icon" aria-label="Delete reminder" onClick={() => void remove(`${base}/reminders/${reminder.id}`, 'Reminder')}><Trash2 size={14} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
