'use client'

import { User, Bell, Lock, Globe, Moon } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* User Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-6 w-6 text-[#111]" />
            <h2 className="text-xl font-semibold text-[#111]">User Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Name</label>
              <input type="text" className="glass-input w-full px-3 py-2 rounded-lg" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Email</label>
              <input type="email" className="glass-input w-full px-3 py-2 rounded-lg" placeholder="Your email" />
            </div>
            <button className="glass-button px-6 py-2 rounded-lg glass-button text-white font-semibold hover:scale-105 transition-transform transition">
              Update Profile
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="h-6 w-6 text-[#111]" />
            <h2 className="text-xl font-semibold text-[#111]">Security</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Current Password</label>
              <input type="password" className="glass-input w-full px-3 py-2 rounded-lg" placeholder="Current password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">New Password</label>
              <input type="password" className="glass-input w-full px-3 py-2 rounded-lg" placeholder="New password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Confirm Password</label>
              <input type="password" className="glass-input w-full px-3 py-2 rounded-lg" placeholder="Confirm password" />
            </div>
            <button className="glass-button px-6 py-2 rounded-lg glass-button text-white font-semibold hover:scale-105 transition-transform transition">
              Change Password
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-6 w-6 text-[#111]" />
            <h2 className="text-xl font-semibold text-[#111]">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#111] font-medium">Email Notifications</div>
                <div className="text-[#333] text-sm">Receive email updates about your activity</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#111] font-medium">Asset Alerts</div>
                <div className="text-[#333] text-sm">Get notified about asset status changes</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#111] font-medium">Maintenance Reminders</div>
                <div className="text-[#333] text-sm">Receive maintenance schedule reminders</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Moon className="h-6 w-6 text-[#111]" />
            <h2 className="text-xl font-semibold text-[#111]">Display</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#111] font-medium">Dark Mode</div>
                <div className="text-[#333] text-sm">Use dark theme across the application</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Language</label>
              <select className="glass-input w-full px-3 py-2 rounded-lg">
                <option>English</option>
                <option>Indonesian</option>
                <option>Spanish</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="h-6 w-6 text-[#111]" />
            <h2 className="text-xl font-semibold text-[#111]">System</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Time Zone</label>
              <select className="glass-input w-full px-3 py-2 rounded-lg">
                <option>UTC-7 (Pacific Time)</option>
                <option>UTC+7 (Jakarta Time)</option>
                <option>UTC+0 (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">Date Format</label>
              <select className="glass-input w-full px-3 py-2 rounded-lg">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
