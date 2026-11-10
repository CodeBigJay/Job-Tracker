import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Briefcase, Plus, LogOut, RefreshCw, Search, Pencil, Trash2,
  ExternalLink, LayoutDashboard, X, CalendarDays
} from 'lucide-react';
import './style.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const API = `${API_BASE}/api`;

const statuses = [
  'SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW',
  'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'
] as const;

type Status = typeof statuses[number];

type JobApplication = {
  id: string;
  company: string;
  jobTitle: string;
  location?: string | null;
  jobUrl?: string | null;
  salary?: string | null;
  source?: string | null;
  status: Status;
  appliedDate?: string | null;
  closingDate?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApplicationForm = {
  company: string;
  jobTitle: string;
  location: string;
  jobUrl: string;
  salary: string;
  source: string;
  status: Status;
  appliedDate: string;
  closingDate: string;
  description: string;
};

const emptyForm: ApplicationForm = {
  company: '',
  jobTitle: '',
  location: '',
  jobUrl: '',
  salary: '',
  source: '',
  status: 'APPLIED',
  appliedDate: '',
  closingDate: '',
  description: ''
};

async function readResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let data: any = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.error || data?.detail || data?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }

  return data as T;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('jobtrack-token') || '');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const request = useCallback(async <T,>(path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API}${path}`, { ...options, headers });
    return readResponse<T>(response);
  }, [token]);

  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const [items, summary] = await Promise.all([
        request<JobApplication[]>(`/applications${query}`),
        request<Record<string, number>>('/applications/dashboard/counts')
      ]);
      setApplications(items || []);
      setCounts(summary || {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load your applications.');
    }
  }, [request, statusFilter, token]);

  useEffect(() => {
    if (token) {
      void refreshData();
    } else {
      setApplications([]);
      setCounts({});
    }
  }, [token, refreshData]);

  const visibleApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return applications;
    return applications.filter(item =>
      [item.company, item.jobTitle, item.location, item.source]
        .some(value => value?.toLowerCase().includes(term))
    );
  }, [applications, search]);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const payload = isLogin
        ? { email, password }
        : { fullName, email, password };

      const response = await fetch(`${API}/auth/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await readResponse<{ token: string }>(response);
      localStorage.setItem('jobtrack-token', data.token);
      setToken(data.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  function updateForm<K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function saveApplication(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const payload = {
      ...form,
      appliedDate: form.appliedDate || null,
      closingDate: form.closingDate || null,
      location: form.location || null,
      jobUrl: form.jobUrl || null,
      salary: form.salary || null,
      source: form.source || null,
      description: form.description || null
    };

    try {
      await request(
        editingId ? `/applications/${editingId}` : '/applications',
        { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      setForm(emptyForm);
      setEditingId(null);
      setMessage(editingId ? 'Application updated.' : 'Application added.');
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this application.');
    } finally {
      setBusy(false);
    }
  }

  function startEditing(application: JobApplication) {
    setEditingId(application.id);
    setForm({
      company: application.company || '',
      jobTitle: application.jobTitle || '',
      location: application.location || '',
      jobUrl: application.jobUrl || '',
      salary: application.salary || '',
      source: application.source || '',
      status: application.status || 'SAVED',
      appliedDate: application.appliedDate || '',
      closingDate: application.closingDate || '',
      description: application.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteApplication(id: string) {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    try {
      await request<void>(`/applications/${id}`, { method: 'DELETE' });
      setMessage('Application deleted.');
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete this application.');
    }
  }

  function signOut() {
    localStorage.removeItem('jobtrack-token');
    setToken('');
    setPassword('');
    setMessage('');
    setForm(emptyForm);
    setEditingId(null);
  }

  if (!token) {
    return (
      <main className="auth-page">
        <form onSubmit={authenticate} className="auth-card">
          <div className="brand-mark"><Briefcase size={25} /></div>
          <p className="eyebrow">YOUR CAREER, ORGANISED</p>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted">Keep every application and opportunity in one place.</p>
          {!isLogin && (
            <label>
              Full name
              <input value={fullName} onChange={event => setFullName(event.target.value)} required />
            </label>
          )}
          <label>
            Email address
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required />
          </label>
          <button className="primary-button full-width" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
          <button type="button" className="text-button" onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
            {isLogin ? 'New here? Create an account' : 'Already registered? Sign in'}
          </button>
          {message && <p className="feedback error">{message}</p>}
        </form>
      </main>
    );
  }

  const totalApplications = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const activeApplications = (counts.SAVED || 0) + (counts.APPLIED || 0) +
    (counts.SCREENING || 0) + (counts.INTERVIEW || 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="JobTrack home">
          <span className="brand-mark small"><Briefcase size={19} /></span>
          <span>JobTrack</span>
        </a>
        <div className="topbar-actions">
          <span className="account-label">{email || 'Your workspace'}</span>
          <button className="secondary-button" onClick={signOut}><LogOut size={16} /> Sign out</button>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow"><LayoutDashboard size={14} /> APPLICATION WORKSPACE</p>
          <h1>Good to see you.</h1>
          <p className="muted">Keep track of where every opportunity stands.</p>
        </div>
        <button className="primary-button" onClick={() => {
          setEditingId(null);
          setForm(emptyForm);
          document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
        }}>
          <Plus size={17} /> Add application
        </button>
      </section>

      <section className="stats-grid" aria-label="Application summary">
        <div className="stat-card"><span>Total applications</span><strong>{totalApplications}</strong><small>All tracked opportunities</small></div>
        <div className="stat-card"><span>In progress</span><strong>{activeApplications}</strong><small>Saved through interview</small></div>
        <div className="stat-card"><span>Interviews</span><strong>{counts.INTERVIEW || 0}</strong><small>Interview stage</small></div>
        <div className="stat-card"><span>Offers</span><strong>{counts.OFFER || 0}</strong><small>Offers received</small></div>
      </section>

      <section className="content-grid">
        <form id="application-form" className="surface application-form" onSubmit={saveApplication}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{editingId ? 'UPDATE DETAILS' : 'NEW OPPORTUNITY'}</p>
              <h2>{editingId ? 'Edit application' : 'Add an application'}</h2>
            </div>
            {editingId && <button type="button" className="icon-button" aria-label="Cancel editing" onClick={() => { setEditingId(null); setForm(emptyForm); }}><X size={18} /></button>}
          </div>
          <label>Company<input value={form.company} onChange={e => updateForm('company', e.target.value)} required maxLength={150} /></label>
          <label>Job title<input value={form.jobTitle} onChange={e => updateForm('jobTitle', e.target.value)} required maxLength={150} /></label>
          <div className="form-row">
            <label>Location<input value={form.location} onChange={e => updateForm('location', e.target.value)} /></label>
            <label>Status<select value={form.status} onChange={e => updateForm('status', e.target.value as Status)}>{statuses.map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label>
          </div>
          <div className="form-row">
            <label>Applied date<input type="date" value={form.appliedDate} onChange={e => updateForm('appliedDate', e.target.value)} /></label>
            <label>Closing date<input type="date" value={form.closingDate} onChange={e => updateForm('closingDate', e.target.value)} /></label>
          </div>
          <label>Job posting URL<input type="url" placeholder="https://" value={form.jobUrl} onChange={e => updateForm('jobUrl', e.target.value)} /></label>
          <div className="form-row">
            <label>Salary / range<input value={form.salary} onChange={e => updateForm('salary', e.target.value)} /></label>
            <label>Source<input placeholder="Company site, LinkedIn…" value={form.source} onChange={e => updateForm('source', e.target.value)} /></label>
          </div>
          <label>Notes<textarea rows={3} value={form.description} onChange={e => updateForm('description', e.target.value)} /></label>
          <button className="primary-button full-width" disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Save application'}
          </button>
        </form>

        <section className="surface applications-panel">
          <div className="section-heading list-heading">
            <div><p className="eyebrow">YOUR PIPELINE</p><h2>Applications</h2></div>
            <button className="icon-button" onClick={() => void refreshData()} aria-label="Refresh applications"><RefreshCw size={17} /></button>
          </div>
          <div className="toolbar">
            <div className="search-box"><Search size={17} /><input aria-label="Search applications" placeholder="Search company, role or location" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {statuses.map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
            </select>
          </div>

          {visibleApplications.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={28} />
              <h3>{search || statusFilter ? 'No matching applications' : 'Your list is empty'}</h3>
              <p>{search || statusFilter ? 'Try another search or status filter.' : 'Add your first opportunity using the form.'}</p>
            </div>
          ) : (
            <div className="application-list">
              {visibleApplications.map(application => (
                <article className="application-item" key={application.id}>
                  <div className="application-main">
                    <div className="application-title-row">
                      <h3>{application.jobTitle}</h3>
                      <span className={`status-pill status-${application.status.toLowerCase()}`}>{application.status.replace('_', ' ')}</span>
                    </div>
                    <p className="company-name">{application.company}{application.location ? ` · ${application.location}` : ''}</p>
                    <div className="application-meta">
                      {application.appliedDate && <span><CalendarDays size={13} /> Applied {application.appliedDate}</span>}
                      {application.jobUrl && <a href={application.jobUrl} target="_blank" rel="noreferrer">Job posting <ExternalLink size={12} /></a>}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="icon-button" aria-label={`Edit ${application.jobTitle}`} onClick={() => startEditing(application)}><Pencil size={16} /></button>
                    <button className="icon-button danger-icon" aria-label={`Delete ${application.jobTitle}`} onClick={() => void deleteApplication(application.id)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {message && <div className="toast" role="status"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Dismiss message"><X size={15} /></button></div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
