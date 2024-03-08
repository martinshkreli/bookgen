import { FolderArrowDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import useSWR from 'swr';
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import models from '/utils/models.json';

export default function SheetsNav({id, sheetData, sheetNames, currentSheet}) {
  const thisModel = models.find((x) => x.id === id);
  const supportingData = thisModel.files || false;
  
  return (
    <div className="w-full items-center flex py-3 pl-4 ">
      <Link href="/models" className="text-md text-left">&larr;</Link>
      <div className="ml-2 flex items-center justify-center">
        <span className="mx-1">|</span> 
        {id}.xlsx 
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button>
              <FolderArrowDownIcon className="mt-1 h-5 w-5 ml-2 cursor-pointer"/>
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href={`/modelrepo/${id}.xlsx`} 
                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm`}
                    >
                      Download Model
                    </a>
                  )}
                </Menu.Item>
              </div>
              {/* TODO: Filter out edge case where supporting items are folders (GSK is example) */}
              {supportingData?.length > 0 && <div className="py-1">
                <span className="text-sm block font-bold my-2 ml-4">Supporting Documents:</span>
                {supportingData.map((supportingItem) => {
                  if(supportingItem.path) {
                    return (
                      <Menu.Item key={`/modelrepo/${id}/${supportingItem.path}`}>
                        {({ active }) => (
                          <a
                            target="_blank"
                            href={`/modelrepo/${id}/${supportingItem.path}`}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block truncate px-4 py-2 text-sm`}
                          >
                          {supportingItem.name}
                          </a>
                        )}
                      </Menu.Item>
                    )
                  }
                })}
              </div>}
            </Menu.Items>
          </Transition>
        </Menu>
        <span className="mx-1">|</span> 
      </div>
      {sheetNames && sheetNames.map((sheet, i) => (
        <Link key={`sheet-${id}-link-${sheet}`} href={`/models/${id}/${sheet}`}>
          <span className={`${sheet === currentSheet ? "border-b-2 border-gray-500" : ""} p-1 my-2 ml-2`}>{sheet}</span>
        </Link>
      ))}
    </div>
  )
}
