'use client'
import { useFormContext } from 'react-hook-form'
export default function EssaySection(){
  const { register } = useFormContext()
  return (
    <section className="card">
      <h2 className="section-title">Essay</h2>
      <p className="hint mb-2">Min 100 characters. Share your goals and impact.</p>
      <textarea rows={6} className="input" {...register('essay')} />
    </section>
  )
}
