import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getUpdates, addUpdate, editUpdate, removeUpdate, type UpdateItem } from '@/services/updateService';

export default function UpdatesAdmin() {
  const [updates, setUpdates] = useState<UpdateItem[]>(getUpdates());
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'feature' as UpdateItem['category'] });

  const refresh = () => setUpdates(getUpdates());

  return (
    <div className="space-y-4">
      {/* New Update Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-white">Nouvelle mise a jour</h4>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Titre" className="w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white" />
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description" rows={3} className="w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white" />
        <div className="flex gap-2">
          <button onClick={() => {
            if (!form.title.trim()) return;
            if (editing) { editUpdate(editing, form); setEditing(null); }
            else { addUpdate(form); }
            setForm({ title: '', description: '', category: 'feature' });
            refresh();
          }} className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-xl text-sm text-white">
            {editing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editing ? 'Modifier' : 'Ajouter'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm({ title: '', description: '', category: 'feature' }); }} className="px-4 py-2 text-sm text-slate-400">Annuler</button>}
        </div>
      </div>

      {/* Updates List */}
      {updates.map((u) => (
        <div key={u.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 cursor-pointer" onClick={() => setExpanded(expanded === u.id ? null : u.id)}>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">{u.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${u.category === 'feature' ? 'bg-blue-500/20 text-blue-400' : u.category === 'bugfix' ? 'bg-red-500/20 text-red-400' : u.category === 'improvement' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{u.category}</span>
              </div>
              {expanded === u.id && <p className="text-xs text-slate-400 mt-2">{u.description}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(u.id); setForm({ title: u.title, description: u.description, category: u.category }); }} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => { removeUpdate(u.id); refresh(); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setExpanded(expanded === u.id ? null : u.id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">{expanded === u.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
