'use client'
import { useFormContext } from 'react-hook-form'
export default function TermsSection(){
  const { register } = useFormContext()
  return (
    <section className="card">
      <h2 className="section-title">Terms & Conditions</h2>
      <div className="prose max-w-none text-sm text-gray-700 mb-3">
        <p>By submitting, you confirm all information is accurate and agree to program policies.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('acceptedTerms')} className="h-4 w-4" />
        I accept the terms.
      </label>
    </section>
  )
}
