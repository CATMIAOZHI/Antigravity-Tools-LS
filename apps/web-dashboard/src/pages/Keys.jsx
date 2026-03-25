import React, { useState, useEffect } from 'react';
import { useSpotlight } from '../hooks/useSpotlight';
import { 
  Plus, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Key, 
  ShieldCheck, 
  Activity, 
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  Shield,
  Zap,
  Pencil
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useKeyStore from '../store/useKeyStore';
import useAppStore from '../store/useAppStore';
import { BaseModal, ConfirmModal } from '../components/Modal';

const CreateKeyModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { createKey } = useKeyStore();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const { addToast } = useAppStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const key = await createKey(name.trim());
      setNewKey(key);
      addToast(t('keys.createSuccess') || 'Key created', 'success');
    } catch (err) {
      addToast(t('accounts.submitFailed') + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (newKey) {
    return (
      <BaseModal 
        isOpen={isOpen} 
        onClose={() => { setNewKey(null); setName(''); onClose(); }} 
        title={t('keys.successTitle')} 
        subtitle={t('keys.successSubtitle')}
        accentColor="bg-emerald-500"
        footerText={t('accounts.dismiss')}
      >
        <div className="py-6 space-y-6">
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] uppercase tracking-widest italic border-b border-emerald-500/10 pb-3">
              <ShieldCheck className="w-4 h-4" /> {t('keys.createSuccess')}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-foreground/55 uppercase font-black tracking-widest pl-1">{t('common.name') || 'NAME'}: {newKey.name}</span>
              <div className="flex items-center gap-3 bg-background/40 border border-glass-border rounded-xl p-4 group/key relative overflow-hidden">
                <code className="text-emerald-400/90 font-mono text-xs break-all flex-1">{newKey.key}</code>
                <button onClick={() => copyToClipboard(newKey.key)} className="p-2.5 bg-foreground/5 hover:bg-emerald-500/20 text-foreground/65 hover:text-emerald-400 rounded-lg transition-all border border-glass-border">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-foreground/45 italic leading-relaxed px-2">
            {t('keys.importantTip')}
          </p>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('keys.createTitle')} 
      subtitle={t('keys.createSubtitle')}
      footerText={t('common.close')}
    >
      <form onSubmit={handleSubmit} className="py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em] pl-1">{t('keys.nameLabel')}</label>
          <input 
            autoFocus
            type="text" 
            placeholder={t('keys.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-glass-border rounded-2xl px-6 py-4 text-sm text-foreground focus:outline-none focus:border-blue-500/50 focus:bg-foreground/[0.05] transition-all"
          />
        </div>
        <button 
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] flex items-center justify-center gap-3"
        >
          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
          {t('keys.generateBtn')}
        </button>
      </form>
    </BaseModal>
  );
};

const EditKeyModal = ({ isOpen, onClose, keyData }) => {
  const { t } = useTranslation();
  const { renameKey } = useKeyStore();
  const [nameInput, setNameInput] = useState(keyData?.name || '');
  const [keyInput, setKeyInput] = useState(keyData?.key || '');
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useAppStore();

  // 每次弹窗打开时重置表单
  useEffect(() => {
    if (isOpen && keyData) {
      setNameInput(keyData.name);
      setKeyInput(keyData.key);
    }
  }, [isOpen, keyData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() && !keyInput.trim()) return;

    const newName = nameInput.trim() !== keyData.name ? nameInput.trim() : undefined;
    const newKey  = keyInput.trim()  !== keyData.key  ? keyInput.trim()  : undefined;

    if (!newName && !newKey) { onClose(); return; }

    setIsSaving(true);
    try {
      await renameKey(keyData.key, newName, newKey);
      addToast(t('keys.updateSuccess') || 'Key updated', 'success');
      onClose();
    } catch (err) {
      addToast(t('accounts.updateLabelFailed') + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('keys.editTitle')} subtitle={keyData?.name} accentColor="bg-amber-500" footerText={t('common.close')}>
      <form onSubmit={handleSave} className="py-6 space-y-5">

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em] pl-1 flex items-center gap-2">
            <Pencil className="w-3 h-3" /> {t('keys.nameLabel')}
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-glass-border rounded-2xl px-5 py-3.5 text-sm text-foreground focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em] pl-1 flex items-center gap-2">
            <Key className="w-3 h-3" /> {t('keys.keyValueLabel')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-foreground/[0.03] border border-glass-border rounded-2xl px-5 py-3.5 text-sm text-foreground font-mono focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <p className="text-[9px] text-foreground/45 italic pl-2">
            {t('keys.keyWarning')}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {t('keys.saveBtn')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

const KeyRow = ({ keyData }) => {
  const { t } = useTranslation();
  const { deleteKey } = useKeyStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const { addToast } = useAppStore();
  const onConfirm = async () => {
    setIsConfirmOpen(false);
    setIsDeleting(true);
    try {
      await deleteKey(keyData.key);
      addToast(t('keys.deleteSuccess') || 'Key deleted', 'success');
    } catch (err) {
      addToast(t('accounts.deleteFailed') + err.message, 'error');
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(keyData.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = `${keyData.key.substring(0, 16)}••••••••••••${keyData.key.substring(keyData.key.length - 4)}`;

  return (
    <div className="group spotlight-card flex items-center px-4 py-3 bg-foreground/[0.01] hover:bg-foreground/[0.03] border-b border-glass-border transition-all cursor-pointer relative overflow-hidden">
      <div className="grain-overlay" />
      <div className="flex items-center gap-4 w-[30%] min-w-[280px]">
        <div className="shrink-0 p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Key className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] md:text-sm font-black text-foreground/95 truncate italic tracking-tight">{keyData.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-foreground/45 hover:text-amber-400 transition-all"
              title={t('keys.edit')}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[9px] font-black text-blue-500/50 uppercase tracking-[0.2em]">{t('keys.activeStatus')}</span>
        </div>
      </div>
      
      <div className="flex-1 flex px-6">
        <div onClick={copyToClipboard} className="bg-background/40 border border-glass-border rounded-lg px-3 py-1.5 flex items-center gap-3 group/masked relative overflow-hidden cursor-pointer">
          <code className="text-[11px] font-mono text-foreground/40 tracking-wider transition-colors group-hover/masked:text-blue-400 font-bold">{maskedKey}</code>
          <button className="text-foreground/45 hover:text-foreground transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="w-[12%] flex flex-col items-end gap-1 shrink-0 px-4">
        <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-foreground/40 uppercase">
          <Clock className="w-3 h-3" />
          <span>{t('keys.issued')}</span>
        </div>
        <div className="text-[9px] text-foreground/60 font-mono font-bold tracking-widest">
          {new Date(keyData.created_at * 1000).toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' })}
        </div>
      </div>

      <div className="w-[13%] min-w-[150px] flex items-center justify-end gap-0.5 transition-all shrink-0 pr-2">
        <button onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }} className="p-1.5 text-foreground/20 hover:text-amber-400 transition-all" title={t('dashboard.edit')}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={copyToClipboard} className="p-1.5 text-foreground/20 hover:text-blue-400 transition-all" title={t('common.copy')}>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button onClick={handleDelete} disabled={isDeleting} className="p-1.5 text-foreground/45 hover:text-rose-500 transition-all" title={t('keys.deleteTitle')}>
          <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <EditKeyModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} keyData={keyData} />
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onConfirm}
        title={t('keys.deleteTitle')}
        message={t('keys.deleteConfirm', { name: keyData.name })}
        type="danger"
        confirmText={t('keys.confirmDelete')}
      />
    </div>
  );
};

const Keys = () => {
  const { t } = useTranslation();
  const spotlightRef = useSpotlight();
  const { keys, fetchKeys, isLoading } = useKeyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const filteredKeys = keys.filter(k => 
    k.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={spotlightRef} className="space-y-8 fade-in relative spotlight-group">
      <div className="sticky top-0 z-[100] -mx-4 px-4 py-4 mb-8 bg-background/60 backdrop-blur-2xl border-b border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300">
        <div className="flex items-center gap-6 px-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-foreground/45 uppercase tracking-[0.3em]">{t('keys.credentials')}</span>
            <span className="text-xl font-black italic tracking-tight">{keys.length} <span className="text-foreground/45 text-sm font-normal not-italic mx-1">/</span> {t('keys.keyMatrix')}</span>
          </div>
          
          <div className="h-8 w-px bg-foreground/10 hidden md:block"></div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={t('keys.searchPlaceholder')} 
              className="bg-foreground/[0.03] border border-glass-border px-10 py-2 rounded-full text-xs font-bold outline-none focus:border-blue-500/50 transition-all w-32 md:w-48 lg:w-64" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pr-4">
          <button onClick={() => fetchKeys()} className={`w-10 h-10 flex items-center justify-center bg-foreground/[0.03] border border-glass-border rounded-xl transition-all ${isLoading ? 'text-emerald-400' : 'text-foreground/40 hover:text-foreground'}`}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 bg-foreground text-background rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" strokeWidth={3} />
            {t('keys.createTitle')}
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-foreground/[0.02] border border-glass-border rounded-[2rem] overflow-hidden shadow-2xl relative">
          <div className="flex items-center px-6 py-4 bg-foreground/[0.01] border-b border-glass-border text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
            <div className="w-[30%] min-w-[280px]">{t('keys.tableHeaderName')}</div>
            <div className="flex-1 px-6">{t('keys.tableHeaderToken')}</div>
            <div className="w-[12%] text-right pr-4">{t('keys.tableHeaderDate')}</div>
            <div className="w-[13%] text-right pr-6">{t('keys.tableHeaderOps')}</div>
          </div>
          
          <div className="flex flex-col min-h-[400px]">
            {isLoading && keys.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-32 gap-6 opacity-30">
                <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.5em] animate-pulse">{t('keys.syncing')}</span>
              </div>
            ) : filteredKeys.length > 0 ? (
              filteredKeys.map(k => <KeyRow key={k.key} keyData={k} />)
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-32 gap-5">
                <div className="w-20 h-20 rounded-3xl bg-foreground/[0.01] border border-dashed border-glass-border flex items-center justify-center">
                  <Key className="w-8 h-8 text-foreground/5" />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/45 mb-1">{t('keys.empty')}</div>
                  <div className="text-[9px] font-bold text-foreground/10 uppercase italic">{t('keys.noKeys')}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-8 py-4 bg-foreground/[0.01] border-t border-glass-border flex justify-between items-center text-[9px] font-black text-foreground/10 tracking-widest uppercase italic">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {t('settings.versionInfo')}: 01.00.ALPHA</span>
              <span className="flex items-center gap-2 text-emerald-500/20"><ShieldCheck className="w-3 h-3 text-emerald-500/50" /> {t('keys.syncing')}</span>
            </div>
            <div>{t('keys.nodeKeyService')}</div>
          </div>
        </div>
      </div>

      <CreateKeyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Keys;
