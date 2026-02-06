'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    Save,
    Activity,
    Heart,
    Sparkles,
    RefreshCw,
    Shield
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { saveLunaraOnboarding } from '@/lib/actions/auth'

interface LunaraSettingsProps {
    initialData: any
    onBack: () => void
    onSave: (newData: any) => void
}

export function LunaraSettings({ initialData, onBack, onSave }: LunaraSettingsProps) {
    const [data, setData] = useState({
        lastPeriodStart: initialData?.last_period_start ? new Date(initialData.last_period_start) : undefined,
        periodLength: initialData?.avg_period_length?.toString() || '5',
        cycleLength: initialData?.avg_cycle_length?.toString() || '28',
        regularity: initialData?.regularity || 'yes',
        contraception: initialData?.contraception || 'none',
        tryingToConceive: initialData?.trying_to_conceive ? 'yes' : 'no',
        symptoms: initialData?.typical_symptoms || [],
        trackingGoals: initialData?.tracking_goals || [],
        sharingEnabled: initialData?.sharing_enabled || false
    })

    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

    const handleSave = async () => {
        setSaving(true)
        try {
            // Fix: Send date as YYYY-MM-DD string to avoid timezone shifts (e.g. IST midnight -> UTC previous day)
            const submissionData = {
                ...data,
                lastPeriodStart: data.lastPeriodStart ? format(data.lastPeriodStart, 'yyyy-MM-dd') : null
            }
            const result = await saveLunaraOnboarding(submissionData)
            if (result.success) {
                toast({
                    title: "Settings Saved",
                    description: "Your Lunara profile has been updated.",
                    variant: "success"
                })
                onSave(data)
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error.message || "An error occurred while saving.",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const toggleSymptom = (symptom: string) => {
        setData((prev: any) => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter((s: string) => s !== symptom)
                : [...prev.symptoms, symptom]
        }))
    }

    const toggleGoal = (goal: string) => {
        setData((prev: any) => ({
            ...prev,
            trackingGoals: prev.trackingGoals.includes(goal)
                ? prev.trackingGoals.filter((g: string) => g !== goal)
                : [...prev.trackingGoals, goal]
        }))
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pt-8 pb-24 px-4 overflow-y-auto">
            <div className="flex items-center justify-between gap-4">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="text-purple-300 hover:text-white hover:bg-purple-500/10 rounded-full px-4"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back to Insights
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="icon"
                    className="md:hidden bg-purple-600 hover:bg-purple-700 text-white rounded-full w-10 h-10 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="hidden md:flex bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Period Basics */}
                <Card className="bg-zinc-950/40 border-purple-500/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-200">
                            <CalendarIcon className="w-4 h-4 text-purple-400" />
                            Period History
                        </CardTitle>
                        <CardDescription className="text-zinc-500">When and how long?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Last Period Start</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn(
                                        "w-full h-10 justify-start text-left font-normal bg-zinc-900/30 border-zinc-800 text-zinc-200",
                                        !data.lastPeriodStart && "text-zinc-500"
                                    )}>
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {data.lastPeriodStart ? format(data.lastPeriodStart, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800">
                                    <Calendar
                                        mode="single"
                                        selected={data.lastPeriodStart}
                                        onSelect={(date) => setData({ ...data, lastPeriodStart: date })}
                                        disabled={(date) => date > new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Period Length (Days)</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {['3', '4', '5', '6', '7+'].map(len => (
                                    <button
                                        key={len}
                                        onClick={() => setData({ ...data, periodLength: len })}
                                        className={cn(
                                            "h-10 rounded-lg border transition-all text-xs font-bold",
                                            data.periodLength === len
                                                ? "bg-purple-600 border-purple-500 text-white"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                                        )}
                                    >
                                        {len}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cycle Rhythm */}
                <Card className="bg-zinc-950/40 border-purple-500/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-200">
                            <Activity className="w-4 h-4 text-purple-400" />
                            Cycle Rhythm
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Predictability and duration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Regularity</Label>
                            <RadioGroup
                                value={data.regularity}
                                onValueChange={(val) => setData({ ...data, regularity: val })}
                                className="grid grid-cols-3 gap-2"
                            >
                                {[
                                    { label: 'Regular', val: 'yes' },
                                    { label: 'Sometimes', val: 'sometimes' },
                                    { label: 'Irregular', val: 'rarely' }
                                ].map(opt => (
                                    <div key={opt.val}>
                                        <RadioGroupItem value={opt.val} id={`reg-${opt.val}`} className="peer sr-only" />
                                        <Label
                                            htmlFor={`reg-${opt.val}`}
                                            className={cn(
                                                "flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-[10px] font-bold uppercase tracking-tighter",
                                                "bg-zinc-900 border-zinc-800 text-zinc-400 peer-data-[state=checked]:bg-purple-900/40 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:text-purple-100"
                                            )}
                                        >
                                            {opt.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Average Cycle Length</Label>
                            <Select
                                value={data.cycleLength}
                                onValueChange={(val) => setData({ ...data, cycleLength: val })}
                            >
                                <SelectTrigger
                                    className="w-full bg-zinc-900/30 border-[#424242] text-zinc-200 h-10 rounded-none border-0 border-b"
                                    activeBorderClassName="border-veritas-purple"
                                >
                                    <SelectValue placeholder="Select cycle length" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                                    {[...Array(20)].map((_, i) => (
                                        <SelectItem key={20 + i} value={(20 + i).toString()}>
                                            {20 + i} Days
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Life Context */}
                <Card className="bg-zinc-950/40 border-purple-500/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-200">
                            <Heart className="w-4 h-4 text-purple-400" />
                            Life Context
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Contraception and goals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Birth Control</Label>
                            <div className="flex flex-wrap gap-2">
                                {['None', 'Pills', 'IUD', 'Implant', 'Other'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setData({ ...data, contraception: opt.toLowerCase() })}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full border transition-all font-medium text-[10px] uppercase tracking-wider",
                                            data.contraception === opt.toLowerCase()
                                                ? "bg-purple-600 border-purple-500 text-white"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Trying to Conceive?</Label>
                            <RadioGroup
                                value={data.tryingToConceive}
                                onValueChange={(val) => setData({ ...data, tryingToConceive: val })}
                                className="grid grid-cols-2 gap-2"
                            >
                                {['Yes', 'No'].map(opt => (
                                    <div key={opt}>
                                        <RadioGroupItem value={opt.toLowerCase()} id={`conceive-${opt}`} className="peer sr-only" />
                                        <Label
                                            htmlFor={`conceive-${opt}`}
                                            className={cn(
                                                "flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-[10px] font-bold uppercase tracking-tighter",
                                                "bg-zinc-900 border-zinc-800 text-zinc-400 peer-data-[state=checked]:bg-purple-900/40 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:text-purple-100"
                                            )}
                                        >
                                            {opt}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                {/* Symptoms & Goals */}
                <Card className="bg-zinc-950/40 border-purple-500/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-200">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Personalisation
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Symptoms and tracking focus.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Common Symptoms</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Cramps', 'Fatigue', 'Mood swings', 'Headache', 'Bloating'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleSymptom(s)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-tight",
                                            data.symptoms.includes(s)
                                                ? "bg-purple-600/20 border-purple-600 text-purple-200"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tracking Focus</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Stress', 'Sleep', 'Energy', 'Emotions'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => toggleGoal(g)}
                                        className={cn(
                                            "p-2 rounded-lg border transition-all text-left flex items-center gap-2",
                                            data.trackingGoals.includes(g)
                                                ? "bg-purple-900/20 border-purple-500 text-white"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-3 h-3 rounded-full border flex items-center justify-center",
                                            data.trackingGoals.includes(g) ? "border-purple-400 bg-purple-500" : "border-zinc-700"
                                        )} />
                                        <span className="font-bold text-[10px] uppercase tracking-wider">{g}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy & Sync */}
                <Card className="bg-zinc-950/40 border-indigo-500/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-200">
                            <Shield className="w-4 h-4 text-indigo-400" />
                            Privacy & Partner Sync
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Control what your partner sees.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold text-indigo-100">Share Cycle Status</Label>
                                <p className="text-[10px] text-indigo-300/50 uppercase tracking-widest font-bold font-serif italic">Let partner see your current phase</p>
                            </div>
                            <Switch
                                checked={data.sharingEnabled}
                                onCheckedChange={(checked) => setData({ ...data, sharingEnabled: checked })}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-500 italic px-1">
                            When enabled, your partner will see your current cycle day, phase name, and tailored advice on how to support you.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center py-4 opacity-30">
                <p className="text-[10px] italic tracking-[0.2em] uppercase">All health data is encrypted and private</p>
            </div>

            {/* Bottom Save Button */}
            <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-6 shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold text-base"
            >
                {saving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Save Settings
            </Button>
        </div>
    )
}
