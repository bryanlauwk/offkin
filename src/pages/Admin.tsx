import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoLink, setLogoLink] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (error) throw error;
      
      data?.forEach(setting => {
        if (setting.key === 'logo_url') setLogoUrl(setting.value || '');
        if (setting.key === 'logo_link') setLogoLink(setting.value || '');
        if (setting.key === 'site_title') setSiteTitle(setting.value || '');
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-settings', {
        body: { password },
      });
      if (error || !data?.ok) {
        toast.error('Incorrect password');
        return;
      }
      setIsAuthenticated(true);
      toast.success('Welcome, admin!');
    } catch {
      toast.error('Incorrect password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-settings', {
        body: {
          password,
          settings: {
            logo_url: logoUrl,
            logo_link: logoLink,
            site_title: siteTitle,
          },
        },
      });
      if (error || !data?.ok) throw error ?? new Error('Save failed');

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-serif italic">Admin Access</CardTitle>
            <CardDescription>Enter the admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <Link to="/" className="block text-center text-sm text-muted-foreground hover:underline">
                ← Back to studio
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl font-bold italic">Site Settings</h1>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading settings...</p>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo Settings</CardTitle>
                <CardDescription>Configure the logo displayed in the header</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logoUrl">Logo Image URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use the site title as a wordmark
                  </p>
                </div>

                <div>
                  <Label htmlFor="logoLink">Logo Link URL</Label>
                  <Input
                    id="logoLink"
                    value={logoLink}
                    onChange={(e) => setLogoLink(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                {logoUrl && (
                  <div className="mt-4">
                    <Label className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4" /> Preview
                    </Label>
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <img 
                        src={logoUrl} 
                        alt="Logo preview" 
                        className="h-10 w-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Title</CardTitle>
                <CardDescription>Optional: Override the default site title</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="siteTitle">Title</Label>
                  <Input
                    id="siteTitle"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    placeholder="Brandkin"
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
