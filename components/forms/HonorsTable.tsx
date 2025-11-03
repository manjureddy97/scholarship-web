'use client'
import { useFormContext, useFieldArray } from 'react-hook-form'
export default function HonorsTable(){
  const { control, register } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'honors' })
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">Honors & Awards</h2>
        <button type="button" className="btn-outline" onClick={()=>append({ name:'', desc:'', year:'' })}>Add</button>
      </div>
      <div className="space-y-3">
        {fields.map((f, i)=>(
          <div key={f.id} className="grid gap-3 md:grid-cols-3">
            <input className="input" placeholder="Award name" {...register(`honors.${i}.name` as const)} />
            <input className="input" placeholder="Description" {...register(`honors.${i}.desc` as const)} />
            <input className="input" placeholder="Year" {...register(`honors.${i}.year` as const)} />
            <button type="button" className="text-sm text-red-600" onClick={()=>remove(i)}>Remove</button>
          </div>
        ))}
        {fields.length===0 && <p className="hint">No honors added yet.</p>}
      </div>
    </section>
  )
}
