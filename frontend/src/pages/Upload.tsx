import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, XCircle, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useEffect } from 'react';

const Upload = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: string[] } | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await api.getGroups();
        setGroups(data);
      } catch (e: any) {
        toast({ title: 'Failed to load groups', description: e.message || 'Error loading groups', variant: 'destructive' });
      }
    };
    loadGroups();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isCsv = selectedFile.name.toLowerCase().endsWith('.csv') || selectedFile.type === 'text/csv';
      if (isCsv) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        toast({
          title: 'Unsupported File',
          description: 'Please upload a CSV file. Excel (.xlsx/.xls) is not supported in-browser.',
          variant: 'destructive',
        });
      }
    }
  };

  const formatPhoneForLookup = (p: string) => {
    const trimmed = p.replace(/\s+/g, '');
    if (trimmed.startsWith('0')) return '250' + trimmed.slice(1);
    return trimmed;
  };

  const parseExcelFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const phones: string[] = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (i === 0 && /phone/i.test(line)) continue;
            const cell = line.split(/[;,\t]/)[0]?.trim() || '';
            const digits = cell.replace(/[^0-9]/g, '');
            if (digits) phones.push(digits);
          }
          resolve(phones);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedGroup) {
      toast({
        title: 'Missing Information',
        description: 'Please select a group and upload a file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const phones = await parseExcelFile(file);
      let success = 0;
      const failed: string[] = [];
      for (const phone of phones) {
        try {
          const formatted = formatPhoneForLookup(phone);
          const info = await api.getCustomerInfo(formatted);
          const fn = info?.firstName || 'Unknown';
          const ln = info?.lastName || 'User';
          const bd = info?.birthDate ? String(info.birthDate).slice(0, 10) : undefined;
          const genderCode = info?.gender === 'Male' ? 'MALE' : info?.gender === 'Female' ? 'FEMALE' : 'OTHER';
          await api.addMember({
            firstName: fn,
            lastName: ln,
            birthDate: bd,
            genderCode,
            isActive: info?.isActive ?? true,
            nationalId: `ID${Date.now()}${Math.floor(Math.random()*1000)}`,
            phone: formatted,
            groupId: selectedGroup,
          });
          success += 1;
        } catch (e) {
          failed.push(phone);
        }
      }
      const result = { success, failed };
      
      setUploadResult(result);
      
      toast({
        title: 'Upload Complete',
        description: `Successfully added ${result.success} members. ${result.failed.length} failed.`,
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadErrorFile = () => {
    if (!uploadResult || uploadResult.failed.length === 0) return;

    const content = 'Phone Numbers (Failed)\n' + uploadResult.failed.join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_numbers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const content = 'Phone Numbers\n0712345678\n0723456789\n0734567890';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Excel Upload</h1>
        <p className="text-muted-foreground mt-2">Bulk import members from Excel file</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
          <CardDescription>Follow these steps to import members</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Download the template file or prepare your Excel/CSV file</li>
            <li>Add phone numbers in the first column (10 digits each)</li>
            <li>Select the target group from the dropdown below</li>
            <li>Upload the file and wait for processing</li>
            <li>Review the results and download failed numbers if any</li>
          </ol>
          <Button variant="outline" className="mt-4" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Members</CardTitle>
          <CardDescription>Select group and upload Excel file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Target Group</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Upload Excel File</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    {file ? (
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          CSV files only (first column: phone numbers)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !selectedGroup || isUploading}
            className="w-full"
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            {isUploading ? 'Processing...' : 'Upload and Process'}
          </Button>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{uploadResult.success}</p>
                  <p className="text-sm text-muted-foreground">Successfully Added</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{uploadResult.failed.length}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>

            {uploadResult.failed.length > 0 && (
              <div>
                <Button variant="outline" onClick={downloadErrorFile}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Failed Numbers
                </Button>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Failed Phone Numbers:</p>
                  <div className="flex flex-wrap gap-2">
                    {uploadResult.failed.map((phone, index) => (
                      <span key={index} className="px-2 py-1 bg-destructive/20 text-xs rounded">
                        {phone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Upload;
