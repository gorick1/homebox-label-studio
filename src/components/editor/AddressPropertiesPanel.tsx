import { useState } from 'react';
import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Barcode,
  Info,
} from 'lucide-react';
import type { AddressElement } from '@/types/label';
import { validateAddress, getUspsUserId } from '@/lib/uspsApi';
import { 
  generateIMBarcode, 
  buildRoutingCode, 
  SERVICE_TYPE_IDS, 
  BARCODE_IDS,
  formatTrackingCode,
} from '@/lib/intelligentMailBarcode';

interface AddressPropertiesPanelProps {
  element: AddressElement;
}

export default function AddressPropertiesPanel({ element }: AddressPropertiesPanelProps) {
  const { updateElement, addElement, selectedElementId } = useLabelEditorContext();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [showIMbDialog, setShowIMbDialog] = useState(false);
  
  // IMb dialog state
  const [imbBarcodeId, setImbBarcodeId] = useState('00');
  const [imbServiceType, setImbServiceType] = useState('001');
  const [imbMailerId, setImbMailerId] = useState('');
  const [imbSerialNumber, setImbSerialNumber] = useState('');

  const hasUspsConfigured = !!getUspsUserId();

  const updateAddress = (field: keyof AddressElement['address'], value: string) => {
    if (!selectedElementId) return;
    
    updateElement(selectedElementId, {
      address: {
        ...element.address,
        [field]: value,
      },
      // Mark as not validated when address changes
      isValidated: false,
    });
    setValidationError(null);
    setValidationWarning(null);
  };

  const handleValidate = async () => {
    if (!selectedElementId) return;
    
    setIsValidating(true);
    setValidationError(null);
    setValidationWarning(null);
    
    try {
      const result = await validateAddress(element.address);
      
      if (result.success && result.address) {
        updateElement(selectedElementId, {
          address: result.address,
          isValidated: true,
        });
        
        if (result.returnText) {
          setValidationWarning(result.returnText);
        }
      } else {
        setValidationError(result.error || 'Validation failed');
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to validate address');
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateIMb = () => {
    // Build routing code from validated address
    const routingCode = buildRoutingCode(
      element.address.zip5,
      element.address.zip4,
      element.address.deliveryPoint
    );

    // Generate serial number if not provided
    const serial = imbSerialNumber || Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
    
    // Validate mailer ID
    const mailerIdLength = imbMailerId.length;
    if (mailerIdLength !== 6 && mailerIdLength !== 9) {
      setValidationError('Mailer ID must be 6 or 9 digits');
      return;
    }

    // Adjust serial number length based on mailer ID
    const serialLength = mailerIdLength === 6 ? 9 : 6;
    const adjustedSerial = serial.slice(0, serialLength).padStart(serialLength, '0');

    const result = generateIMBarcode({
      barcodeId: imbBarcodeId,
      serviceTypeId: imbServiceType,
      mailerId: imbMailerId,
      serialNumber: adjustedSerial,
      routingCode,
    });

    if (!result.success) {
      setValidationError(result.error || 'Failed to generate IMb');
      return;
    }

    // Add IMb element to the label
    addElement('imbarcode', {
      barcodeId: imbBarcodeId,
      serviceTypeId: imbServiceType,
      mailerId: imbMailerId,
      serialNumber: adjustedSerial,
      routingCode,
    });

    setShowIMbDialog(false);
  };

  const canGenerateIMb = element.isValidated && element.address.zip5;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={element.isValidated ? "secondary" : "default"}
          className="flex-1 gap-2"
          onClick={handleValidate}
          disabled={isValidating || !hasUspsConfigured}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : element.isValidated ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          {element.isValidated ? 'Re-validate' : 'Validate'}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => setShowIMbDialog(true)}
          disabled={!canGenerateIMb}
        >
          <Barcode className="h-4 w-4" />
          Gen IMb
        </Button>
      </div>

      {!hasUspsConfigured && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 text-warning-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            Configure your USPS User ID in Settings to enable address validation.
          </p>
        </div>
      )}

      {/* Validation Status */}
      {element.isValidated && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">
            Validated
            {element.address.zip4 && ` (ZIP+4: ${element.address.zip5}-${element.address.zip4})`}
          </span>
        </div>
      )}

      {validationWarning && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 text-warning-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">{validationWarning}</p>
        </div>
      )}

      {validationError && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">{validationError}</p>
        </div>
      )}

      <Separator />

      {/* Address Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Recipient Name</Label>
          <Input
            value={element.address.name}
            onChange={(e) => updateAddress('name', e.target.value)}
            placeholder="John Smith"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Company (optional)</Label>
          <Input
            value={element.address.company || ''}
            onChange={(e) => updateAddress('company', e.target.value)}
            placeholder="Acme Inc."
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Street Address</Label>
          <Input
            value={element.address.street1}
            onChange={(e) => updateAddress('street1', e.target.value)}
            placeholder="123 Main Street"
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Address Line 2 (optional)</Label>
          <Input
            value={element.address.street2 || ''}
            onChange={(e) => updateAddress('street2', e.target.value)}
            placeholder="Apt 4B"
            className="h-9 text-sm"
          />
        </div>

        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">City</Label>
            <Input
              value={element.address.city}
              onChange={(e) => updateAddress('city', e.target.value)}
              placeholder="Anytown"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">State</Label>
            <Input
              value={element.address.state}
              onChange={(e) => updateAddress('state', e.target.value.toUpperCase().slice(0, 2))}
              placeholder="NY"
              maxLength={2}
              className="h-9 text-sm"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">ZIP Code</Label>
            <Input
              value={element.address.zip4 ? `${element.address.zip5}-${element.address.zip4}` : element.address.zip5}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9-]/g, '');
                const parts = value.split('-');
                updateAddress('zip5', parts[0]?.slice(0, 5) || '');
                if (parts[1]) {
                  updateAddress('zip4', parts[1].slice(0, 4));
                }
              }}
              placeholder="12345-6789"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* IMb Generation Dialog */}
      <Dialog open={showIMbDialog} onOpenChange={setShowIMbDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Intelligent Mail Barcode</DialogTitle>
            <DialogDescription>
              Configure IMb parameters to generate a USPS Intelligent Mail Barcode for this address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">Barcode ID</Label>
              <Select value={imbBarcodeId} onValueChange={setImbBarcodeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BARCODE_IDS.map((bc) => (
                    <SelectItem key={bc.id} value={bc.id}>
                      {bc.id} - {bc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Service Type</Label>
              <Select value={imbServiceType} onValueChange={setImbServiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPE_IDS.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.id} - {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Mailer ID (6 or 9 digits)</Label>
              <Input
                value={imbMailerId}
                onChange={(e) => setImbMailerId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="123456 or 123456789"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your USPS-assigned Mailer ID. Apply at{' '}
                <a 
                  href="https://postalpro.usps.com/mailing/mailer-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  USPS PostalPro
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Serial Number (optional)</Label>
              <Input
                value={imbSerialNumber}
                onChange={(e) => setImbSerialNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="Auto-generated if blank"
                className="font-mono"
              />
            </div>

            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground">
                <strong>Routing Code:</strong>{' '}
                {buildRoutingCode(element.address.zip5, element.address.zip4, element.address.deliveryPoint) || 'None'}
              </p>
              {element.address.deliveryPoint && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  Full 11-digit routing (ZIP+4+DP)
                </Badge>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIMbDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateIMb} disabled={!imbMailerId || imbMailerId.length < 6}>
              Generate Barcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
