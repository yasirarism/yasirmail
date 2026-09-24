import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Trash2, Plus, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ThemePicker } from '@/components/theme-picker';
import { Translations } from '@/lib/i18n';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    systemDomains: string[];
    savedDomains: string[];
    onUpdateDomains: (domains: string[]) => void;
    translations: Translations;
}

export function SettingsDialog({
    open,
    onOpenChange,
    systemDomains,
    savedDomains,
    onUpdateDomains,
    translations
}: SettingsDialogProps) {
    const t = translations;
    const [newDomain, setNewDomain] = useState('');

    const handleAddDomain = (e: React.FormEvent) => {
        e.preventDefault();
        const domain = newDomain.trim();
        if (domain && !savedDomains.includes(domain) && !systemDomains.includes(domain)) {
            onUpdateDomains([...savedDomains, domain]);
            setNewDomain('');
            toast.success(t.toastDomainAdded);
        }
    };

    const handleDeleteDomain = (domain: string) => {
        onUpdateDomains(savedDomains.filter(d => d !== domain));
        toast.success(t.toastDomainRemoved);
    };

    const customDomains = savedDomains.filter(d => !systemDomains.includes(d));

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Dialog Container - Fixed Flex Centering */}
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="fixed inset-0" style={{ background: 'rgba(26,26,26,0.55)' }} onClick={() => onOpenChange(false)} />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 4 }}
                            transition={{ duration: 0.08, ease: 'easeOut' }}
                            className="relative w-full max-w-lg z-10"
                        >
                            <div
                                className="brutal-card-lg flex flex-col max-h-[85vh] overflow-hidden"
                                style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '2px solid var(--ink)', background: 'var(--brutal-bg)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, border: '2px solid var(--ink)', background: 'var(--brutal-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brutal-on-accent)' }}>
                                            <Settings2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)' }}>{t.dialogTitle}</h3>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.dialogSubtitle}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onOpenChange(false)}
                                        aria-label="Close"
                                        style={{ width: 34, height: 34, borderRadius: 10, border: '2px solid var(--ink)', background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--brutal-shadow-sm)', transition: 'transform 0.12s, box-shadow 0.12s' }}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                <div style={{ padding: '20px', overflowY: 'auto', background: 'var(--surface)' }} className="custom-scrollbar">
                                    <div className="space-y-6">
                                        <ThemePicker t={t} />
                                        {/* System Domains */}
                                        <div className="space-y-3">
                                            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t.systemDomainsTitle}</h4>
                                            <div className="grid gap-2">
                                                {systemDomains.map(domain => (
                                                    <div key={domain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--ink)', background: 'var(--brutal-bg)' }}>
                                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{domain}</span>
                                                        <span className="brutal-chip" style={{ fontSize: '0.65rem', background: 'var(--brutal-accent)', color: 'var(--brutal-on-accent)' }}>{t.defaultBadge}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom Domains */}
                                        <div className="space-y-3">
                                            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t.customDomainsTitle}</h4>
                                            
                                            <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: 8 }}>
                                                <Input 
                                                    placeholder={t.customDomainPlaceholder}
                                                    value={newDomain}
                                                    onChange={(e) => setNewDomain(e.target.value)}
                                                    className="brutal-input"
                                                    style={{ height: 40, fontSize: '0.85rem' }}
                                                />
                                                <Button type="submit" size="icon" disabled={!newDomain.trim()} className="shrink-0" style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid var(--ink)', background: 'var(--brutal-accent)', color: 'var(--brutal-on-accent)', boxShadow: 'var(--brutal-shadow-sm)' }}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </form>

                                            <div className="grid gap-2">
                                                {customDomains.length === 0 ? (
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>{t.customDomainEmpty}</p>
                                                ) : (
                                                    customDomains.map(domain => (
                                                        <div key={domain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--ink)', background: 'var(--brutal-bg)', transition: 'background 0.15s' }}>
                                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{domain}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteDomain(domain)}
                                                                aria-label={`Remove ${domain}`}
                                                                style={{ width: 32, height: 32, borderRadius: 8, border: '2px solid var(--ink)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.12s, background 0.12s' }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.color = '#d93025'; e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--surface)'; }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
