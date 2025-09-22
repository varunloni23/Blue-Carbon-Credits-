import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const ModernDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [recentProjects, setRecentProjects] = useState([
    {
      id: 1,
      name: 'Mangrove Restoration - Mumbai',
      ecosystem: 'Mangrove',
      area: 150,
      credits: 450,
      status: 'verified',
      location: 'Mumbai, Maharashtra'
    },
    {
      id: 2,
      name: 'Seagrass Conservation - Kerala',
      ecosystem: 'Seagrass',
      area: 89,
      credits: 267,
      status: 'under_review',
      location: 'Kochi, Kerala'
    },
    {
      id: 3,
      name: 'Wetland Protection - Gujarat',
      ecosystem: 'Wetland',
      area: 200,
      credits: 600,
      status: 'pending',
      location: 'Kutch, Gujarat'
    },
    {
      id: 4,
      name: 'Salt Marsh Recovery - Tamil Nadu',
      ecosystem: 'Salt Marsh',
      area: 120,
      credits: 360,
      status: 'verified',
      location: 'Chennai, Tamil Nadu'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      className="min-h-screen font-outfit"
      style={{ 
        background: 'linear-gradient(135deg, #6789BE 0%, #4a6ba3 25%, #5f7db5 50%, #7a95d1 75%, #8ba4db 100%)',
        minHeight: '100vh',
        fontFamily: 'Outfit, Inter, sans-serif'
      }}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-3xl font-bold font-outfit" 
              style={{ color: '#FFFFFF' }}
            >
              Blue Carbon MRV Dashboard
            </h1>
            <p 
              className="font-outfit mt-1" 
              style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              Monitoring, Reporting & Verification System
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div 
              className="modern-card px-4 py-2 font-outfit"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
                color: '#FFFFFF'
              }}
            >
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Stats Grid - Enhanced Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: 'Total Projects', 
              subtitle: 'Active restoration sites',
              value: '24', 
              unit: '',
              change: '+12%', 
              positive: true,
              chart: '🌊',
              accent: '#22C55E'
            },
            { 
              title: 'Carbon Credits', 
              subtitle: 'tCO₂ issued this month',
              value: '1.2k', 
              unit: 'tCO₂',
              change: '+8.5%', 
              positive: true,
              chart: '🌱',
              accent: '#3B82F6'
            },
            { 
              title: 'Verification Rate', 
              subtitle: 'Projects verified',
              value: '94.2', 
              unit: '%',
              change: '+2.1%', 
              positive: true,
              chart: '✅',
              accent: '#F59E0B'
            },
            { 
              title: 'Community Impact', 
              subtitle: 'Families benefited',
              value: '156', 
              unit: 'families',
              change: '+15%', 
              positive: true,
              chart: '👥',
              accent: '#EF4444'
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className="relative p-8 transition-all duration-300 hover:scale-[1.05] hover:-translate-y-2 group"
              style={{ 
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '28px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Glass effect overlay */}
              <div 
                className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
                  borderRadius: '28px'
                }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {stat.chart}
                  </div>
                  <div 
                    className="px-3 py-2 rounded-full text-xs font-bold font-outfit"
                    style={{ 
                      background: stat.positive 
                        ? 'rgba(34, 197, 94, 0.25)' 
                        : 'rgba(239, 68, 68, 0.25)',
                      color: stat.positive ? '#10B981' : '#EF4444',
                      border: `1px solid ${stat.positive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {stat.positive ? '↗' : '↘'} {stat.change}
                  </div>
                </div>

                {/* Main Value */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span 
                      className="text-4xl font-black font-outfit"
                      style={{ color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                    >
                      {stat.value}
                    </span>
                    <span 
                      className="text-base font-outfit font-semibold"
                      style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      {stat.unit}
                    </span>
                  </div>
                </div>

                {/* Title and Subtitle */}
                <div className="space-y-1">
                  <h3 
                    className="text-sm font-bold font-outfit"
                    style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                  >
                    {stat.title}
                  </h3>
                  <p 
                    className="text-xs font-outfit"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {stat.subtitle}
                  </p>
                </div>

                {/* Accent Glow */}
                <div 
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ 
                    backgroundColor: stat.accent,
                    filter: 'blur(8px)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Tab Navigation with Strong Glassmorphism */}
        <div 
          className="rounded-3xl mb-8 font-outfit overflow-hidden relative"
          style={{ 
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Glass overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
            }}
          />
          
          <div className="border-b border-white/8 relative z-10">
            <nav className="flex space-x-2 p-3">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'projects', label: 'Projects', icon: '🌿' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
                { id: 'verification', label: 'Verification', icon: '✅' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 font-outfit relative group",
                    activeTab === tab.id
                      ? "text-white shadow-2xl"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                  style={{
                    background: activeTab === tab.id 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'transparent',
                    backdropFilter: activeTab === tab.id ? 'blur(25px)' : 'none',
                    WebkitBackdropFilter: activeTab === tab.id ? 'blur(25px)' : 'none',
                    border: activeTab === tab.id 
                      ? '1px solid rgba(255, 255, 255, 0.25)' 
                      : '1px solid transparent',
                    boxShadow: activeTab === tab.id 
                      ? '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      : 'none'
                  }}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                  
                  {/* Active tab glow */}
                  {activeTab === tab.id && (
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-20"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)'
                      }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Enhanced Tab Content */}
          <div className="p-8 relative z-10">
            {activeTab === 'projects' && (
              <div className="space-y-8">
                <h3 className="text-2xl font-bold font-outfit" style={{ color: '#FFFFFF' }}>
                  Recent Projects
                </h3>
                <div className="space-y-6">
                  {recentProjects.map((project) => (
                    <div 
                      key={project.id}
                      className="font-outfit p-8 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group relative"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.06)',
                        backdropFilter: 'blur(35px)',
                        WebkitBackdropFilter: 'blur(35px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                      }}
                    >
                      {/* Glass effect overlay */}
                      <div 
                        className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-300 rounded-3xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
                        }}
                      />
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-xl font-outfit mb-3" style={{ color: '#FFFFFF' }}>
                            {project.name}
                          </h4>
                          <div className="flex items-center gap-8 text-sm font-outfit" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                  background: 'rgba(34, 197, 94, 0.2)',
                                  border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}
                              >
                                <span className="text-sm">🌿</span>
                              </div>
                              <span className="font-semibold">Ecosystem: {project.ecosystem}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)'
                                }}
                              >
                                <span className="text-sm">📏</span>
                              </div>
                              <span className="font-semibold">Area: {project.area} ha</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.2)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)'
                                }}
                              >
                                <span className="text-sm">🌱</span>
                              </div>
                              <span className="font-semibold">Credits: {project.credits} tCO₂</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline"
                            className="font-outfit font-bold px-6 py-3 rounded-2xl text-sm"
                            style={{ 
                              background: project.status === 'verified' 
                                ? 'rgba(34, 197, 94, 0.2)' 
                                : project.status === 'under_review'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(59, 130, 246, 0.2)',
                              color: project.status === 'verified' 
                                ? '#10B981' 
                                : project.status === 'under_review'
                                ? '#F59E0B'
                                : '#3B82F6',
                              border: `2px solid ${
                                project.status === 'verified' 
                                  ? 'rgba(34, 197, 94, 0.4)' 
                                  : project.status === 'under_review'
                                  ? 'rgba(245, 158, 11, 0.4)'
                                  : 'rgba(59, 130, 246, 0.4)'
                              }`,
                              backdropFilter: 'blur(15px)',
                              WebkitBackdropFilter: 'blur(15px)'
                            }}
                          >
                            {project.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="font-outfit font-bold px-8 py-3 rounded-2xl text-sm"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.12)',
                              color: '#FFFFFF',
                              border: '2px solid rgba(255, 255, 255, 0.25)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                              e.target.style.transform = 'scale(1.05) translateY(-2px)';
                              e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                              e.target.style.transform = 'scale(1) translateY(0)';
                              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-8">
                <h3 className="text-2xl font-bold font-outfit" style={{ color: '#FFFFFF' }}>
                  Dashboard Overview
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Enhanced Wind Energy Chart Card */}
                  <Card 
                    className="col-span-1 lg:col-span-2 relative group"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(35px)',
                      WebkitBackdropFilter: 'blur(35px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '32px',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    {/* Glass overlay */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
                      }}
                    />
                    
                    <CardHeader className="pb-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-outfit text-lg font-bold mb-3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Project Analytics
                          </CardTitle>
                          <div className="flex items-center gap-6 mt-3">
                            <span className="text-4xl font-black font-outfit" style={{ color: '#FFFFFF' }}>18</span>
                            <span className="text-base font-outfit font-semibold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>total projects</span>
                            <div 
                              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" 
                              style={{ 
                                background: 'rgba(34, 197, 94, 0.25)', 
                                color: '#22C55E',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                backdropFilter: 'blur(15px)'
                              }}
                            >
                              ↗ +5.2%
                            </div>
                          </div>
                        </div>
                        <div 
                          className="text-right px-6 py-4 rounded-2xl"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <div className="text-2xl font-bold font-outfit" style={{ color: '#FFFFFF' }}>450</div>
                          <div className="text-sm font-outfit" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>tCO₂ total</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      {/* Enhanced Chart Visualization */}
                      <div className="relative h-32 mb-6 p-4 rounded-2xl" 
                           style={{
                             background: 'rgba(255, 255, 255, 0.05)',
                             border: '1px solid rgba(255, 255, 255, 0.1)'
                           }}>
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-1">
                          {[
                            { height: '40%', color: 'rgba(34, 197, 94, 0.6)', glow: '#22C55E' },
                            { height: '60%', color: 'rgba(34, 197, 94, 0.7)', glow: '#22C55E' },
                            { height: '35%', color: 'rgba(34, 197, 94, 0.5)', glow: '#22C55E' },
                            { height: '70%', color: 'rgba(34, 197, 94, 0.8)', glow: '#22C55E' },
                            { height: '50%', color: 'rgba(34, 197, 94, 0.6)', glow: '#22C55E' },
                            { height: '80%', color: 'rgba(34, 197, 94, 0.9)', glow: '#22C55E' },
                            { height: '45%', color: 'rgba(34, 197, 94, 0.6)', glow: '#22C55E' },
                            { height: '65%', color: 'rgba(34, 197, 94, 0.7)', glow: '#22C55E' },
                            { height: '90%', color: '#22C55E', glow: '#22C55E' },
                            { height: '75%', color: 'rgba(34, 197, 94, 0.8)', glow: '#22C55E' },
                            { height: '60%', color: 'rgba(34, 197, 94, 0.7)', glow: '#22C55E' },
                            { height: '85%', color: 'rgba(34, 197, 94, 0.9)', glow: '#22C55E' }
                          ].map((bar, index) => (
                            <div
                              key={index}
                              className="flex-1 rounded-t-xl transition-all duration-500 hover:scale-105"
                              style={{
                                height: bar.height,
                                backgroundColor: bar.color,
                                marginX: '1px',
                                boxShadow: `0 0 16px ${bar.glow}40`,
                                border: `1px solid ${bar.color}`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm font-outfit" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <span className="font-semibold">0</span>
                        <span className="font-semibold">carbon sequestration rate</span>
                        <span className="font-semibold">present</span>
                        <span className="font-semibold">450</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Wind & Nacelle Card */}
                  <Card 
                    className="relative group"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(35px)',
                      WebkitBackdropFilter: 'blur(35px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '32px',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    {/* Glass overlay */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
                      }}
                    />
                    
                    <CardHeader className="pb-6 relative z-10">
                      <CardTitle className="font-outfit text-lg font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Project Distribution
                      </CardTitle>
                      <div className="text-sm font-outfit" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        By ecosystem type
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      {/* Enhanced Circular Progress */}
                      <div className="relative w-32 h-32 mx-auto mb-8">
                        {/* Outer ring */}
                        <div 
                          className="absolute inset-0 rounded-full border-4"
                          style={{ 
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            background: 'conic-gradient(#22C55E 0deg 90deg, #3B82F6 90deg 180deg, #8B5CF6 180deg 270deg, #F59E0B 270deg 360deg)'
                          }}
                        />
                        {/* Inner ring */}
                        <div 
                          className="absolute inset-4 rounded-full border-2"
                          style={{ 
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)'
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-black font-outfit mb-1" style={{ color: '#FFFFFF' }}>24</div>
                            <div className="text-xs font-outfit" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>total</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 text-sm font-outfit">
                        {[
                          { type: 'Mangrove', count: 8, color: '#22C55E' },
                          { type: 'Seagrass', count: 6, color: '#3B82F6' },
                          { type: 'Wetland', count: 4, color: '#8B5CF6' },
                          { type: 'Salt Marsh', count: 6, color: '#F59E0B' }
                        ].map((item) => (
                          <div key={item.type} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                              />
                              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{item.type}</span>
                            </div>
                            <span className="font-bold text-lg" style={{ color: '#FFFFFF' }}>{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Overview Stats Card */}
                  <Card 
                    className="col-span-1 lg:col-span-1 relative group"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(35px)',
                      WebkitBackdropFilter: 'blur(35px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '32px',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    {/* Glass overlay */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
                      }}
                    />
                    
                    <CardHeader className="pb-6 relative z-10">
                      <CardTitle className="font-outfit text-lg font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Project Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-6">
                        {/* Enhanced central number */}
                        <div className="text-center py-8">
                          <div className="text-5xl font-black font-outfit mb-3" style={{ color: '#FFFFFF' }}>125</div>
                          <div className="text-base font-outfit font-semibold" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Active Projects</div>
                        </div>
                        
                        {/* Enhanced status indicators */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 rounded-2xl" 
                               style={{ 
                                 background: 'rgba(255, 255, 255, 0.05)',
                                 border: '1px solid rgba(255, 255, 255, 0.1)',
                                 backdropFilter: 'blur(15px)'
                               }}>
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" 
                                   style={{ 
                                     backgroundColor: '#22C55E',
                                     boxShadow: '0 0 12px rgba(34, 197, 94, 0.6)'
                                   }} />
                              <span className="text-sm font-outfit font-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Verified</span>
                            </div>
                            <span className="text-xl font-outfit font-bold" style={{ color: '#FFFFFF' }}>18</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-4 rounded-2xl" 
                               style={{ 
                                 background: 'rgba(255, 255, 255, 0.05)',
                                 border: '1px solid rgba(255, 255, 255, 0.1)',
                                 backdropFilter: 'blur(15px)'
                               }}>
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" 
                                   style={{ 
                                     backgroundColor: '#F59E0B',
                                     boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)'
                                   }} />
                              <span className="text-sm font-outfit font-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Under Review</span>
                            </div>
                            <span className="text-xl font-outfit font-bold" style={{ color: '#FFFFFF' }}>4</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-4 rounded-2xl" 
                               style={{ 
                                 background: 'rgba(255, 255, 255, 0.05)',
                                 border: '1px solid rgba(255, 255, 255, 0.1)',
                                 backdropFilter: 'blur(15px)'
                               }}>
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" 
                                   style={{ 
                                     backgroundColor: '#3B82F6',
                                     boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)'
                                   }} />
                              <span className="text-sm font-outfit font-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Pending</span>
                            </div>
                            <span className="text-xl font-outfit font-bold" style={{ color: '#FFFFFF' }}>2</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Temperature/Environmental Card */}
                  <Card 
                    className="col-span-1 lg:col-span-2 relative group"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(35px)',
                      WebkitBackdropFilter: 'blur(35px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '32px',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    {/* Glass overlay */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
                      }}
                    />
                    
                    <CardHeader className="pb-6 relative z-10">
                      <CardTitle className="font-outfit text-lg font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Environmental Monitoring
                      </CardTitle>
                      <div className="text-sm font-outfit" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Real-time ecosystem health indicators
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-6 rounded-2xl group hover:scale-105 transition-all duration-500" 
                             style={{ 
                               background: 'rgba(239, 68, 68, 0.1)',
                               border: '1px solid rgba(239, 68, 68, 0.3)',
                               backdropFilter: 'blur(20px)'
                             }}>
                          <div className="text-sm font-outfit font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Water Salinity</div>
                          <div className="text-3xl font-black font-outfit mb-3" style={{ color: '#FFFFFF' }}>32.5</div>
                          <div className="text-xs font-outfit mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>ppt</div>
                          <div 
                            className="w-full h-2 rounded-full mb-2"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                          >
                            <div 
                              className="h-2 rounded-full transition-all duration-700"
                              style={{ 
                                backgroundColor: '#EF4444', 
                                width: '70%',
                                boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
                              }}
                            />
                          </div>
                          <div className="text-xs font-outfit font-semibold" style={{ color: '#EF4444' }}>High</div>
                        </div>
                        
                        <div className="text-center p-6 rounded-2xl group hover:scale-105 transition-all duration-500" 
                             style={{ 
                               background: 'rgba(59, 130, 246, 0.1)',
                               border: '1px solid rgba(59, 130, 246, 0.3)',
                               backdropFilter: 'blur(20px)'
                             }}>
                          <div className="text-sm font-outfit font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Tidal Level</div>
                          <div className="text-3xl font-black font-outfit mb-3" style={{ color: '#FFFFFF' }}>1.2</div>
                          <div className="text-xs font-outfit mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>meters</div>
                          <div 
                            className="w-full h-2 rounded-full mb-2"
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                          >
                            <div 
                              className="h-2 rounded-full transition-all duration-700"
                              style={{ 
                                backgroundColor: '#3B82F6', 
                                width: '30%',
                                boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)'
                              }}
                            />
                          </div>
                          <div className="text-xs font-outfit font-semibold" style={{ color: '#3B82F6' }}>Normal</div>
                        </div>
                        
                        <div className="text-center p-6 rounded-2xl group hover:scale-105 transition-all duration-500" 
                             style={{ 
                               background: 'rgba(245, 158, 11, 0.1)',
                               border: '1px solid rgba(245, 158, 11, 0.3)',
                               backdropFilter: 'blur(20px)'
                             }}>
                          <div className="text-sm font-outfit font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>pH Level</div>
                          <div className="text-3xl font-black font-outfit mb-3" style={{ color: '#FFFFFF' }}>8.1</div>
                          <div className="text-xs font-outfit mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>pH</div>
                          <div 
                            className="w-full h-2 rounded-full mb-2"
                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                          >
                            <div 
                              className="h-2 rounded-full transition-all duration-700"
                              style={{ 
                                backgroundColor: '#F59E0B', 
                                width: '50%',
                                boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)'
                              }}
                            />
                          </div>
                          <div className="text-xs font-outfit font-semibold" style={{ color: '#F59E0B' }}>Optimal</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Quick Actions and Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                  
                  {/* Enhanced Quick Actions Card */}
                  <Card 
                    className="relative group"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(35px)',
                      WebkitBackdropFilter: 'blur(35px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '32px',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    {/* Glass overlay */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
                      }}
                    />
                    
                    <CardHeader className="pb-6 relative z-10">
                      <CardTitle className="font-outfit text-lg font-bold mb-2 flex items-center gap-3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        🚀 Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Create New Project */}
                        <div className="p-4 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer group" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-lg">+</span>
                            </div>
                            <div>
                              <div className="font-outfit font-bold text-sm" style={{ color: '#FFFFFF' }}>
                                Create New Project
                              </div>
                              <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Start a new blue carbon restoration project
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Project Status Tracker */}
                        <div className="p-4 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer group" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                              <span className="text-white text-lg">🏛️</span>
                            </div>
                            <div>
                              <div className="font-outfit font-bold text-sm" style={{ color: '#FFFFFF' }}>
                                Project Status Tracker
                              </div>
                              <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Track verification pipeline progress
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NGO Verification Portal */}
                        <div className="p-4 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer group" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white text-lg">✓</span>
                            </div>
                            <div>
                              <div className="font-outfit font-bold text-sm" style={{ color: '#FFFFFF' }}>
                                NGO Verification Portal
                              </div>
                              <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Access 3rd party verification system
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Data Collection */}
                        <div className="p-4 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer group" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-lg">📊</span>
                            </div>
                            <div>
                              <div className="font-outfit font-bold text-sm" style={{ color: '#FFFFFF' }}>
                                Data Collection
                              </div>
                              <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Collect field data and measurements
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Marketplace */}
                        <div className="p-4 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer group" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                              <span className="text-white text-lg">🏪</span>
                            </div>
                            <div>
                              <div className="font-outfit font-bold text-sm" style={{ color: '#FFFFFF' }}>
                                Marketplace
                              </div>
                              <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Trade carbon credits
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Carbon Credits */}
                        <div className="p-4 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer group" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                              <span className="text-white text-lg">💎</span>
                            </div>
                            <div>
                              <div className="font-outfit font-bold text-sm" style={{ color: '#FFFFFF' }}>
                                Carbon Credits
                              </div>
                              <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                Manage tokenized carbon credits
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Recent Activity Card */}
                  <Card 
                    className="relative group"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(35px)',
                      WebkitBackdropFilter: 'blur(35px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '32px',
                      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    {/* Glass overlay */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)'
                      }}
                    />
                    
                    <CardHeader className="pb-6 relative z-10">
                      <CardTitle className="font-outfit text-lg font-bold mb-2 flex items-center gap-3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        📋 Recent Activity
                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">🔔</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-4">
                        
                        {/* Activity Item 1 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">🔵</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-outfit font-bold text-sm mb-1" style={{ color: '#FFFFFF' }}>
                              NGO Verification System Launched
                            </div>
                            <div className="font-outfit text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              3rd party verification portal now available for organizations
                            </div>
                            <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              1 hour ago
                            </div>
                          </div>
                        </div>

                        {/* Activity Item 2 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">✅</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-outfit font-bold text-sm mb-1" style={{ color: '#FFFFFF' }}>
                              Project Status Tracker Active
                            </div>
                            <div className="font-outfit text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Real-time verification pipeline tracking now available
                            </div>
                            <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              2 hours ago
                            </div>
                          </div>
                        </div>

                        {/* Activity Item 3 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">📍</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-outfit font-bold text-sm mb-1" style={{ color: '#FFFFFF' }}>
                              Blockchain Integration Live
                            </div>
                            <div className="font-outfit text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Live project registration on Polygon Amoy testnet operational
                            </div>
                            <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              3 hours ago
                            </div>
                          </div>
                        </div>

                        {/* Activity Item 4 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300" 
                             style={{ 
                               background: 'rgba(255, 255, 255, 0.05)',
                               border: '1px solid rgba(255, 255, 255, 0.1)',
                               backdropFilter: 'blur(15px)'
                             }}>
                          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">🔍</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-outfit font-bold text-sm mb-1" style={{ color: '#FFFFFF' }}>
                              AI Verification Enhanced
                            </div>
                            <div className="font-outfit text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Enhanced AI verification with fraud detection active
                            </div>
                            <div className="font-outfit text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              4 hours ago
                            </div>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            )}

            {(activeTab === 'analytics' || activeTab === 'verification') && (
              <div className="text-center py-12">
                <div className="mb-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 font-outfit" style={{ color: '#FFFFFF' }}>
                  {activeTab === 'analytics' ? 'Analytics' : 'Verification'} Coming Soon
                </h3>
                <p className="font-outfit" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Advanced {activeTab} features are being developed and will be available soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;