
/**
 * Projects listing page with advanced filtering, sorting, and search capabilities.
 * Provides a comprehensive view of all projects with management actions.
 */
import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { Filter, Search, SortAsc, SortDesc, Plus } from 'lucide-react';
import { RiskLevel, Project } from '@/types/project';
import { getAllProjects } from '@/services/projectService';
import CreateProjectModal from '@/components/CreateProjectModal';
import { useToast } from "@/hooks/use-toast";

type SortField = 'name' | 'client' | 'last_updated' | 'risk_level' | 'stage';
type SortOrder = 'asc' | 'desc';

/**
 * Main Projects component that displays a sortable, filterable table of projects
 * @returns JSX element with project management interface
 */
const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('last_updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  // Fetch projects from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  /**
   * Returns appropriate CSS classes for risk level badges
   * @param risk - Risk level string (low, medium, high)
   * @returns CSS class string for badge styling
   */
  const getRiskBadgeColor = (risk: string) => {
    switch(risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Formats date string to user-friendly format
   * @param dateString - ISO date string to format
   * @returns Formatted date string (e.g., "Jan 15, 2024")
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  /**
   * Handles table column sorting by toggling sort order or changing sort field
   * @param field - The field to sort by
   */
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get unique stages and clients for the filter dropdowns
  const uniqueStages = useMemo(() => {
    return [...new Set(projects.map(p => p.stage).filter(Boolean))];
  }, [projects]);

  const uniqueClients = useMemo(() => {
    return [...new Set(projects.map(p => p.client).filter(Boolean))].sort();
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter(project => {
        const matchesSearch = 
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          project.client.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'all' || project.riskLevel === riskFilter;
        const matchesStage = stageFilter === 'all' || project.stage === stageFilter;
        const matchesClient = clientFilter === 'all' || project.client === clientFilter;
        
        return matchesSearch && matchesRisk && matchesStage && matchesClient;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'client') {
          comparison = a.client.localeCompare(b.client);
        } else if (sortField === 'last_updated') {
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        } else if (sortField === 'risk_level') {
          const riskOrder: Record<string, number> = { low: 1, medium: 2, high: 3 };
          comparison = (riskOrder[a.riskLevel as string] || 0) - (riskOrder[b.riskLevel as string] || 0);
        } else if (sortField === 'stage') {
          comparison = (a.stage || '').localeCompare(b.stage || '');
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [projects, searchTerm, riskFilter, stageFilter, clientFilter, sortField, sortOrder]);

  /**
   * Handles successful project creation by adding new project to the list
   * @param newProject - The newly created project to add
   */
  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:ml-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {uniqueStages.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] cursor-pointer" onClick={() => toggleSort('name')}>
                  <div className="flex items-center">
                    Project Name
                    {sortField === 'name' && (
                      sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('client')}>
                  <div className="flex items-center">
                    Client
                    {sortField === 'client' && (
                      sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('risk_level')}>
                  <div className="flex items-center">
                    Risk
                    {sortField === 'risk_level' && (
                      sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('stage')}>
                  <div className="flex items-center">
                    Stage
                    {sortField === 'stage' && (
                      sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('last_updated')}>
                  <div className="flex items-center">
                    Last Updated
                    {sortField === 'last_updated' && (
                      sortOrder === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedProjects.map(project => (
                  <TableRow key={project.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link to={`/project/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>{project.client}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRiskBadgeColor(project.riskLevel || '')}>
                        {project.riskLevel ? project.riskLevel.charAt(0).toUpperCase() + project.riskLevel.slice(1) : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{project.stage || 'N/A'}</TableCell>
                    <TableCell>{formatDate(project.lastUpdated)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateProjectModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onCreateProject={handleProjectCreated} 
      />
    </Layout>
  );
};

export default Projects;
