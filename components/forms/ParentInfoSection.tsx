'use client'
import { useFormContext } from 'react-hook-form'
export default function ParentInfoSection(){
  const { register } = useFormContext()
  return (
    <section className="card">
      <h2 className="section-title">Parent / Employee Information</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1"><span className="label">Relationship</span><input {...register('parent.relationship')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Employee name</span><input {...register('parent.name')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Work location</span><input {...register('parent.location')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Work status</span><input {...register('parent.status')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Hire date</span><input type="date" {...register('parent.hireDate')} className="input"/></label>
      </div>
    </section>
  )
}
