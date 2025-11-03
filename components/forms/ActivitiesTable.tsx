'use client'
import { useFormContext, useFieldArray } from 'react-hook-form'

export default function ActivitiesTable(){
  const { control, register } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'activities' })
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">Clubs & Extracurricular Activities</h2>
        <button type="button" className="btn-outline" onClick={()=>append({ org:'', desc:'', role:'', years:'', current:false })}>Add</button>
      </div>
      <div className="space-y-3">
        {fields.map((f, i)=>(
          <div key={f.id} className="grid gap-3 md:grid-cols-5">
            <input className="input md:col-span-1" placeholder="Organization" {...register(`activities.${i}.org` as const)} />
            <input className="input md:col-span-2" placeholder="Description" {...register(`activities.${i}.desc` as const)} />
            <input className="input" placeholder="Position" {...register(`activities.${i}.role` as const)} />
            <div className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" {...register(`activities.${i}.current` as const)} />
              <span className="text-sm text-gray-700">Current</span>
            </div>
            <button type="button" className="text-sm text-red-600" onClick={()=>remove(i)}>Remove</button>
          </div>
        ))}
        {fields.length===0 && <p className="hint">No activities added yet.</p>}
      </div>
    </section>
  )
}
