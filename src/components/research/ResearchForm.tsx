import { useState } from 'react';
import { Plus, Settings, FileText, Save, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AIProcessingService } from '@/lib/ai';

interface ResearchField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox';
  required: boolean;
  options?: string[]; // For select fields
  placeholder?: string;
}

interface ResearchProject {
  id?: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'completed' | 'paused';
  industry?: string;
  subIndustry?: string;
  tags?: string[] | string; // Can be array or string
  customFields: ResearchField[];
  documents: string[]; // Document IDs
  created_at?: string;
  updated_at?: string;
}

const ResearchForm = ({ onSave, initialData }: { 
  onSave: (project: ResearchProject) => void;
  initialData?: ResearchProject;
}) => {
  const [project, setProject] = useState<ResearchProject>(
    initialData || {
      title: '',
      description: '',
      category: '',
      status: 'active',
      customFields: [],
      documents: [],
      tags: [], // Initialize tags as an empty array
    }
  );
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [newField, setNewField] = useState<Partial<ResearchField>>({
    name: '',
    type: 'text',
    required: false,
  });
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'checkbox', label: 'Checkbox' },
  ];

  const categories = [
    'Market Research',
    'Financial Analysis',
    'Competitive Analysis',
    'Technical Research',
    'Industry Report',
    'Academic Research',
    'Other',
  ];

  const addCustomField = () => {
    if (!newField.name) {
      toast({
        title: "Error",
        description: "Field name is required",
        variant: "destructive",
      });
      return;
    }

    const field: ResearchField = {
      id: Math.random().toString(36).substr(2, 9),
      name: newField.name,
      type: newField.type || 'text',
      required: newField.required || false,
      options: newField.options || [],
      placeholder: newField.placeholder,
    };

    setProject(prev => ({
      ...prev,
      customFields: [...prev.customFields, field],
    }));

    setNewField({ name: '', type: 'text', required: false });
    setShowFieldForm(false);
  };

  const removeCustomField = (fieldId: string) => {
    setProject(prev => ({
      ...prev,
      customFields: prev.customFields.filter(f => f.id !== fieldId),
    }));
  };

  const handleAutoTag = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent form submission
    
    if (!project.title || !project.description) {
      toast({
        title: "Error",
        description: "Please fill in title and description first",
        variant: "destructive",
      });
      return;
    }

    setIsAutoTagging(true);
    try {
      const result = await AIProcessingService.autoTagProject(project.title, project.description);
      
      setProject(prev => ({
        ...prev,
        industry: result.industry,
        subIndustry: result.subIndustry,
        tags: result.tags,
      }));

      toast({
        title: "Auto-tagging Complete",
        description: `Tagged as ${result.industry} > ${result.subIndustry} with ${result.confidence}% confidence`,
      });
    } catch (error) {
      console.error('Auto-tagging error:', error);
      toast({
        title: "Auto-tagging Failed",
        description: "Could not auto-tag the project. Please tag manually.",
        variant: "destructive",
      });
    } finally {
      setIsAutoTagging(false);
    }
  };

  const handleSave = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault(); // Prevent form submission
    }
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a research project",
        variant: "destructive",
      });
      return;
    }

    if (!project.title || !project.description || !project.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure tags is always an array
      const formattedTags = Array.isArray(project.tags) 
        ? project.tags 
        : typeof project.tags === 'string' 
          ? project.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];
      
      // Create a project data object without the problematic columns
      const projectData: any = {
        title: project.title,
        description: project.description,
        category: project.category,
        status: project.status,
        // Store all metadata in custom_fields to avoid schema issues
        custom_fields: [
          ...project.customFields,
          {
            id: 'tags',
            name: 'Tags',
            type: 'tags',
            value: formattedTags
          },
          {
            id: 'industry',
            name: 'Industry',
            type: 'text',
            value: project.industry || ''
          },
          {
            id: 'subIndustry',
            name: 'Sub-Industry',
            type: 'text',
            value: project.subIndustry || ''
          }
        ],
        documents: project.documents,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (project.id) {
        // Update existing project
        const { error } = await supabase
          .from('research_projects')
          .update(projectData)
          .eq('id', project.id);

        if (error) throw error;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('research_projects')
          .insert({
            ...projectData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        projectData.id = data.id;
      }

      // Extract metadata from custom_fields for the callback
      const customFields = projectData.custom_fields.filter(
        (field: any) => !['tags', 'industry', 'subIndustry'].includes(field.id)
      );
      const tagsField = projectData.custom_fields.find((field: any) => field.id === 'tags');
      const industryField = projectData.custom_fields.find((field: any) => field.id === 'industry');
      const subIndustryField = projectData.custom_fields.find((field: any) => field.id === 'subIndustry');

      // Convert back to camelCase for the callback
      const savedProject: ResearchProject = {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        status: projectData.status,
        industry: industryField?.value || '',
        subIndustry: subIndustryField?.value || '',
        tags: tagsField?.value || [],
        customFields: customFields,
        documents: projectData.documents,
        created_at: projectData.created_at,
        updated_at: projectData.updated_at,
      };

      onSave(savedProject);
      toast({
        title: "Success",
        description: `Research project ${project.id ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving research project:', error);
      toast({
        title: "Error",
        description: "Failed to save research project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {project.id ? 'Edit Research Project' : 'Create New Research Project'}
          </CardTitle>
          <CardDescription>
            Configure your research project with custom fields and document associations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={project.title}
                onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={project.category} onValueChange={(value) => setProject(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={project.description}
              onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your research project"
              rows={3}
            />
          </div>

          {/* Auto-tagging Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Industry Classification</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoTag}
                disabled={isAutoTagging || !project.title || !project.description}
                className="gap-2"
              >
                {isAutoTagging ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isAutoTagging ? 'Tagging...' : 'Auto-tag with AI'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={project.industry || ''}
                  onChange={(e) => setProject(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subIndustry">Sub-Industry</Label>
                <Input
                  id="subIndustry"
                  value={project.subIndustry || ''}
                  onChange={(e) => setProject(prev => ({ ...prev, subIndustry: e.target.value }))}
                  placeholder="e.g., Artificial Intelligence, Biotechnology"
                />
              </div>
            </div>

            {project.tags && project.tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(project.tags) ? 
                    project.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                    :
                    typeof project.tags === 'string' ? 
                      project.tags.split(',').map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag.trim()}
                        </Badge>
                      ))
                      : null
                  }
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={project.status} onValueChange={(value: any) => setProject(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Custom Fields</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFieldForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {project.customFields.length > 0 && (
              <div className="space-y-3">
                {project.customFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{field.type}</Badge>
                      <span className="font-medium">{field.name}</span>
                      {field.required && <Badge variant="outline">Required</Badge>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(field.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showFieldForm && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Name</Label>
                      <Input
                        value={newField.name}
                        onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter field name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select value={newField.type} onValueChange={(value: any) => setNewField(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={newField.required}
                      onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: !!checked }))}
                    />
                    <Label htmlFor="required">Required field</Label>
                  </div>

                  {newField.type === 'select' && (
                    <div className="space-y-2">
                      <Label>Options (comma-separated)</Label>
                      <Input
                        value={newField.options?.join(', ') || ''}
                        onChange={(e) => setNewField(prev => ({ 
                          ...prev, 
                          options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                        }))}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Placeholder (optional)</Label>
                    <Input
                      value={newField.placeholder || ''}
                      onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="Enter placeholder text"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" onClick={addCustomField}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowFieldForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="button" 
              onClick={(e) => handleSave(e)} 
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {project.id ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchForm; 