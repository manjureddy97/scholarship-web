'use client'
import { useFormContext } from 'react-hook-form'

export default function ApplicantDemographicsSection(){
  const { register } = useFormContext()
  return (
    <section className="card">
      <h2 className="section-title">Applicant Demographics</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1"><span className="label">Full name</span><input {...register('fullName')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Email</span><input type="email" {...register('email')} className="input"/></label>
        <label className="grid gap-1 md:col-span-2"><span className="label">Address</span><input {...register('address')} className="input"/></label>
        <label className="grid gap-1"><span className="label">Phone</span><input {...register('phone')} className="input"/></label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('smsOptIn')} className="h-4 w-4" />
          Opt-in to text messages
        </label>
      </div>
    </section>
  )
}
