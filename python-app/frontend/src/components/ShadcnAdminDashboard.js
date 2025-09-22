import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';

const ShadcnAdminDashboard = () => {
  const [projects] = useState([
    {
      id: 1,
      project_name: "Sundarbans Mangrove Restoration",
      ecosystem_type: "mangrove",
      area_hectares: 15.5,
      verification_score: 85,
      status: "verified",
      created_by: "West Bengal Forest Dept",
      created_at: "2024-01-15"
    },
    {
      id: 2,
      project_name: "Kerala Coastal Wetland Conservation",
      ecosystem_type: "wetland",
      area_hectares: 12.3,
      verification_score: 72,
      status: "pending_verification",
      created_by: "Kerala Maritime Board",
      created_at: "2024-02-10"
    },
    {
      id: 3,
      project_name: "Tamil Nadu Seagrass Protection",
      ecosystem_type: "seagrass",
      area_hectares: 22.1,
      verification_score: 91,
      status: "approved",
      created_by: "TN Coastal Development",
      created_at: "2024-01-28"
    }
  ]);

  const [dashboardStats] = useState({
    totalProjects: 24,
    pendingReview: 6,
    approved: 18,
    totalCredits: 1247,
    monthlyGrowth: 12,
    verificationRate: 75
  });

  const getStatusColor = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-800 border-green-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      pending_verification: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      requires_review: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.rejected;
  };

  const getStatusIcon = (status) => {
    const icons = {
      verified: '✅',
      approved: '✅',
      pending_verification: '⏳',
      requires_review: '🔍',
      rejected: '❌'
    };
    return icons[status] || '⚪';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🌊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">NCCR Admin Dashboard</h1>
                <p className="text-slate-600">National Centre for Coastal Research</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Projects
              </CardTitle>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🏗️</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardStats.totalProjects}</div>
              <p className="text-xs text-green-600 mt-1">
                +{dashboardStats.monthlyGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending Review
              </CardTitle>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">⏳</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardStats.pendingReview}</div>
              <p className="text-xs text-slate-600 mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Carbon Credits
              </CardTitle>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">🌱</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardStats.totalCredits.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-1">tCO₂ credits issued</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Verification Rate
              </CardTitle>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">📊</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardStats.verificationRate}%</div>
              <p className="text-xs text-slate-600 mt-1">Approval success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Card className="border border-slate-200">
          <Tabs defaultValue="projects" className="w-full">
            <div className="border-b border-slate-200">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="projects" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 py-4"
                >
                  🔍 Project Review
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 py-4"
                >
                  📊 Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="verification" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 py-4"
                >
                  ✅ Verification
                </TabsTrigger>
                <TabsTrigger 
                  value="map" 
                  className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-6 py-4"
                >
                  🗺️ Location Map
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="projects" className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">Project Management & Review</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Data
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">#{project.id}</h4>
                              <h4 className="font-semibold text-slate-900">{project.project_name}</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Ecosystem:</span> {project.ecosystem_type}
                              </div>
                              <div>
                                <span className="font-medium">Area:</span> {project.area_hectares} ha
                              </div>
                              <div>
                                <span className="font-medium">AI Score:</span> {project.verification_score}/100
                              </div>
                              <div>
                                <span className="font-medium">Created by:</span> {project.created_by}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={cn("border", getStatusColor(project.status))}>
                              {getStatusIcon(project.status)} {project.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Button>
                              <Button variant="outline" size="sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>📈 Carbon Credits Overview</CardTitle>
                    <CardDescription>Total tCO₂ credits issued by ecosystem type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Mangrove', 'Seagrass', 'Wetland', 'Salt Marsh'].map((type, index) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="font-medium">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(index + 1) * 20}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{(index + 1) * 100}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>📊 Project Status Distribution</CardTitle>
                    <CardDescription>Current verification pipeline status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { status: 'Approved', count: 18, color: 'bg-green-500' },
                        { status: 'Pending Review', count: 4, color: 'bg-yellow-500' },
                        { status: 'In Verification', count: 2, color: 'bg-blue-500' }
                      ].map((item) => (
                        <div key={item.status} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", item.color)}></div>
                            <span className="font-medium">{item.status}</span>
                          </div>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="p-6">
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Advanced Verification Tools</h3>
                <p className="text-slate-600 mb-6">
                  AI-powered verification tools and third-party integration features are being developed.
                </p>
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-5a7 7 0 00-14 0v5h5" />
                  </svg>
                  Learn More
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="map" className="p-6">
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Interactive Project Map</h3>
                <p className="text-slate-600 mb-6">
                  View all blue carbon restoration projects on an interactive map with real-time data.
                </p>
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Open Map View
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ShadcnAdminDashboard;