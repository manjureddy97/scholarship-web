'use client'
import { useFormContext } from 'react-hook-form'
export default function AcademicInfoSection(){
  const { register } = useFormContext()
  return (
    <section className="card">
      <h2 className="section-title">Academic Information</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1"><span className="label">Class status</span><select {...register('academic.status')} className="input"><option>Freshman</option><option>Sophomore</option><option>Junior</option><option>Senior</option></select></label>
        <label className="grid gap-1"><span className="label">State</span><input {...register('academic.state')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Institution</span><input {...register('academic.institution')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Institution type</span><select {...register('academic.degree')} className="input"><option>Bachelor</option><option>Associate</option><option>Certificate</option></select></label>
        <label className="grid gap-1"><span className="label">Major</span><input {...register('academic.major')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Anticipated graduation date</span><input type="month" {...register('academic.gradDate')} className="input"/></label>
        <label className="grid gap-1"><span className="label">GPA</span><input type="number" step="0.01" {...register('academic.gpa', { valueAsNumber: true })} className="input"/></label>
      </div>
    </section>
  )
}
