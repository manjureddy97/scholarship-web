'use client'
import { useFormContext, useFieldArray } from 'react-hook-form'
export default function WorkExperienceTable(){
  const { control, register } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'work' })
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">Work / Internship Experience</h2>
        <button type="button" className="btn-outline" onClick={()=>append({ employer:'', title:'', desc:'', start:'', end:'' })}>Add</button>
      </div>
      <div className="space-y-3">
        {fields.map((f, i)=>(
          <div key={f.id} className="grid gap-3 md:grid-cols-5">
            <input className="input" placeholder="Employer" {...register(`work.${i}.employer` as const)} />
            <input className="input" placeholder="Title" {...register(`work.${i}.title` as const)} />
            <input className="input md:col-span-2" placeholder="Description" {...register(`work.${i}.desc` as const)} />
            <input className="input" type="date" {...register(`work.${i}.start` as const)} />
            <input className="input" type="date" {...register(`work.${i}.end` as const)} />
            <button type="button" className="text-sm text-red-600" onClick={()=>remove(i)}>Remove</button>
          </div>
        ))}
        {fields.length===0 && <p className="hint">No work history yet.</p>}
      </div>
    </section>
  )
}
