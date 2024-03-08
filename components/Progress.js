import { ArrowUpRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

export default function Progress({currentStep}) {
  const steps = [
    { code: 1, id: 'Step 1', name: 'Pick Genre', href: '#', status: getStatus(1, currentStep) },
    { code: 2, id: 'Step 2', name: 'Generate Outline', href: '#', status: getStatus(2, currentStep) },
    { code: 3, id: 'Step 3', name: 'Story Parameters', href: '#', status: getStatus(3, currentStep) },
  ]

  function getStatus(thisStep, currentStep) {
    switch(true) {
      case thisStep === currentStep:
        return "current";
        break;
      case thisStep > currentStep:
        return "upcoming";
        break;
      case thisStep < currentStep:
        return "complete" 
        break;
    }
  }
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step) => (
          <li key={step.name} className="md:flex-1">
            {step.status === 'complete' ? (
              <a
                href={step.href}
                className="group flex flex-col border-l-4 border-indigo-600 py-2 pl-4 hover:border-indigo-800 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-800">{step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </a>
            ) : step.status === 'current' ? (
              <a
                href={step.href}
                className="flex flex-col border-l-4 border-indigo-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                aria-current="step"
              >
                <span className="text-sm font-medium text-indigo-600">{step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </a>
            ) : (
              <a
                href={step.href}
                className="group flex flex-col border-l-4 border-gray-200 py-2 pl-4 hover:border-gray-300 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              >
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">{step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
