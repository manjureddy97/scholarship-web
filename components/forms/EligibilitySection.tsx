'use client'
import { useFormContext } from 'react-hook-form'
export default function EligibilitySection(){
  const { register } = useFormContext()
  return (
    <section className="card">
      <h2 className="section-title">Eligibility Details</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1"><span className="label">Geographic restriction</span><input {...register('eligibility.geo')} className="input" placeholder="United States only"/></label>
        <label className="grid gap-1"><span className="label">Minimum GPA</span><input type="number" step="0.01" {...register('eligibility.gpaMin', { valueAsNumber: true })} className="input"/></label>
      </div>
    </section>
  )
}
