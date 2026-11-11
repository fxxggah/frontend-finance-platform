'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ChevronDown, CreditCard, Eye, EyeOff, PiggyBank, Repeat2, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { accountsOverview, dashboardSummary } from '@/lib/mock-data'
import { FinancialSections } from '@/components/dashboard/financial-sections'
import { useDevState } from '@/hooks/use-dev-state'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compactMoney = (n: number) => money.format(n)
function BalanceCard() { const [visible, setVisible] = useState(true); return <Card variant="brand" className="relative overflow-hidden p-5 sm:p-7"><div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full border-[28px] border-white/5" /><div className="pointer-events-none absolute -right-6 -top-14 size-56 rounded-full border-[20px] border-white/5" /><div className="relative"><div className="flex items-center justify-between"><p className="text-sm text-white/70">Saldo total</p><button aria-label={visible ? 'Ocultar saldo' : 'Mostrar saldo'} onClick={() => setVisible(!visible)} className="grid size-9 place-items-center rounded-xl bg-white/10 hover:bg-white/20">{visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button></div><p className="mt-2 tabular-nums text-4xl font-bold tracking-tight sm:text-5xl">{visible ? compactMoney(accountsOverview.totalBalance) : 'R$ ••••'}</p><div className="mt-6 grid grid-cols-2 gap-4"><div><div className="flex items-center gap-1 text-xs text-white/65"><ArrowDownLeft className="size-3 text-[#8FF0C6]" />Receitas do mês</div><p className="mt-1 tabular-nums text-sm font-semibold">{compactMoney(dashboardSummary.totalIncome)}</p></div><div><div className="flex items-center gap-1 text-xs text-white/65"><ArrowUpRight className="size-3 text-[#FF9CB2]" />Despesas do mês</div><p className="mt-1 tabular-nums text-sm font-semibold">{compactMoney(dashboardSummary.totalExpense)}</p></div></div><p className="mt-6 text-xs text-white/65">Em faturas de cartão: <strong className="font-semibold text-white/90">{compactMoney(accountsOverview.creditCardDebt)}</strong></p></div></Card> }
const quick = [['Nova receita', ArrowDownLeft, 'income'], ['Nova despesa', ArrowUpRight, 'expense'], ['Transferir', Repeat2, 'primary'], ['Pagar fatura', CreditCard, 'warning']] as const
function QuickActions() { return <div className="relative z-10 -mt-6 mx-3 grid grid-cols-4 gap-1 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-[0_12px_30px_-16px_rgba(20,23,46,.3)] backdrop-blur-xl sm:mx-8 sm:px-5">{quick.map(([label, Icon, tone]) => <button key={label} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl text-center text-[10px] font-semibold text-foreground transition hover:bg-[#F6F7FD]"><span className={`grid size-10 place-items-center rounded-2xl ${tone === 'income' ? 'bg-[#E6F8F0] text-[#0E9F6E]' : tone === 'expense' ? 'bg-[#FFE9EE] text-[#E11D48]' : tone === 'warning' ? 'bg-[#FFF3DD] text-[#B86A00]' : 'bg-[#EFEAFF] text-[#5B3DF5]'}`}><Icon className="size-4" /></span><span>{label}</span></button>)}</div> }
const kpis = [{ label: 'Receitas do período', value: 8450, change: 4.2, icon: TrendingUp, tone: 'income' }, { label: 'Despesas do período', value: 4826.35, change: -3.1, icon: TrendingDown, tone: 'violet' }, { label: 'Saldo do período', value: 3623.65, change: null, icon: PiggyBank, tone: 'blue' }, { label: 'Faturas em aberto', value: 2315.4, change: 8.6, icon: CreditCard, tone: 'warning' }] as const
function Sparkline({ tone }: { tone: string }) { return <svg aria-hidden="true" className="h-10 w-full" viewBox="0 0 120 36" preserveAspectRatio="none"><path d="M2 29 C 18 24, 20 31, 34 22 S 52 24, 62 15 S 78 21, 90 11 S 108 14, 118 4" fill="none" stroke={tone === 'income' ? '#0E9F6E' : tone === 'warning' ? '#F59E0B' : tone === 'blue' ? '#4F7BFF' : '#5B3DF5'} strokeWidth="2.5" strokeLinecap="round" /></svg> }
function KpiCard({ item }: { item: typeof kpis[number] }) { const palette = item.tone === 'income' ? 'bg-[#E6F8F0] text-[#0E9F6E]' : item.tone === 'warning' ? 'bg-[#FFF3DD] text-[#B86A00]' : item.tone === 'blue' ? 'bg-[#EAF0FF] text-[#4F7BFF]' : 'bg-[#EFEAFF] text-[#5B3DF5]'; const good = item.tone === 'violet' ? (item.change ?? 0) <= 0 : (item.change ?? 0) >= 0; return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between"><div className={`grid size-10 place-items-center rounded-2xl ${palette}`}><item.icon className="size-5" /></div>{item.change === null ? <span className="text-sm text-muted-foreground">—</span> : <span className={`flex items-center gap-0.5 text-xs font-bold ${good ? 'text-[#0E9F6E]' : 'text-[#E11D48]'}`}>{item.change >= 0 ? '+' : '−'}{Math.abs(item.change)}%</span>}</div><p className="mt-4 text-xs text-muted-foreground">{item.label}</p><p className="mt-1 tabular-nums text-lg font-bold sm:text-xl">{compactMoney(item.value)}</p><div className="mt-2"><Sparkline tone={item.tone} /></div></Card> }
export function Dashboard() {
  const state = useDevState();

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)] lg:items-start">
        <section>
          <BalanceCard />
          <QuickActions />
        </section>
        <div className="hidden lg:block"><PeriodSelect /></div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:mt-9 lg:grid-cols-4">
        {kpis.map(item => <KpiCard key={item.label} item={item} />)}
      </div>
      <FinancialSections state={state ?? undefined} />
    </div>
  );
}
function PeriodSelect() { return <div className="rounded-3xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Período</p><p className="mt-2 font-bold">Outubro de 2026</p></div><button aria-label="Selecionar período" className="grid size-10 place-items-center rounded-xl bg-[#EFEAFF] text-[#5B3DF5]"><ChevronDown className="size-4" /></button></div><p className="mt-5 text-sm text-muted-foreground">1 a 31 de out. de 2026</p><div className="mt-4 flex flex-wrap gap-2">{['Dia', 'Semana', 'Mês', 'Ano'].map((p, i) => <button key={p} className={`rounded-xl px-3 py-2 text-xs font-semibold ${i === 2 ? 'bg-[#5B3DF5] text-white' : 'bg-muted text-muted-foreground'}`}>{p}</button>)}</div></div> }
