'use client'

import { Database, Building2, Users, UserCheck, MapPin, Package, Wrench, HardDrive, FolderOpen } from 'lucide-react'
import Link from 'next/link'

const masterModules = [
  {
    name: 'Companies',
      href: '/master/companies',
    icon: Building2,
    description: 'Manage company information and settings',
    color: 'bg-white/600'
  },
  {
    name: 'Departments',
      href: '/master/departments',
    icon: FolderOpen,
    description: 'Organize and manage department structure',
    color: 'bg-white/600'
  },
  {
    name: 'Users',
      href: '/master/users',
    icon: Users,
    description: 'Manage system users and their access',
    color: 'bg-white/600'
  },
  {
    name: 'Employees',
    href: '/master/employees',
    icon: UserCheck,
    description: 'Manage employees who hold assets (NPK, contact, position)',
    color: 'bg-blue-600'
  },
  {
    name: 'Categories',
      href: '/master/categories',
    icon: Package,
    description: 'Categorize assets for better organization',
    color: 'bg-white/600'
  },
  {
    name: 'Locations',
      href: '/master/locations',
    icon: MapPin,
    description: 'Manage physical locations and addresses',
    color: 'bg-white/600'
  },
  {
    name: 'Vendors',
      href: '/master/vendors',
    icon: Users,
    description: 'Manage supplier and vendor information',
    color: 'bg-white/600'
  },
  {
    name: 'Spare Parts',
      href: '/master/spare-parts',
    icon: Wrench,
    description: 'Track spare parts and maintenance items',
    color: 'bg-white/600'
  },
  {
    name: 'Software Assets',
      href: '/master/software-assets',
    icon: HardDrive,
    description: 'Manage software licenses and digital assets',
    color: 'bg-teal-500'
  },
  {
    name: 'Roles',
    href: '/roles',
    icon: Users,
    description: 'Define user roles and access permissions',
    color: 'bg-pink-500'
  },
  {
    name: 'Assets',
    href: '/assets',
    icon: Package,
    description: 'Manage physical assets and lifecycle',
    color: 'bg-white/600'
  }
]

export default function MasterPage() {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="h-8 w-8 text-[#111]" />
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Master Data</h1>
          <p className="text-[#333]">Manage all your system master data from here</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {masterModules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-black/10 overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#111] group-hover:scale-110 transition-transform transition-colors">
                    {module.name}
                  </h3>
                </div>
              </div>
              <p className="text-[#333] text-sm">
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-xl font-semibold text-[#111] mb-4">About Master Data</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium text-[#111] mb-2">What is Master Data?</h3>
            <p className="text-[#333] text-sm">
              Master data represents the core business entities used throughout your asset management system. 
              This includes companies, departments, locations, and other reference data that forms the foundation 
              of your asset tracking and management processes.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-[#111] mb-2">Best Practices</h3>
            <ul className="text-[#333] text-sm space-y-1">
              <li>• Keep master data clean and up-to-date</li>
              <li>• Use consistent naming conventions</li>
              <li>• Regularly review and audit data quality</li>
              <li>• Maintain proper access controls</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}