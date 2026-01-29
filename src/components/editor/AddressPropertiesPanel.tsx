import { useState } from 'react';
import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Barcode,
  Info,
} from 'lucide-react';
import type { AddressElement } from '@/types/label';
import { validateAddress, getUspsUserId, getMailerId } from '@/lib/uspsApi';
import { buildRoutingCode } from '@/lib/intelligentMailBarcode';

interface AddressPropertiesPanelProps {
  element: AddressElement;
}

export default function AddressPropertiesPanel({ element }: AddressPropertiesPanelProps) {
  const { updateElement, addElement, selectedElementId } = useLabelEditorContext();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const hasUspsConfigured = !!getUspsUserId();
  const savedMailerId = getMailerId();

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
    // Validate mailer ID from settings
    if (!savedMailerId || (savedMailerId.length !== 6 && savedMailerId.length !== 9)) {
      setValidationError('Please configure a valid 6 or 9 digit Mailer ID in Settings');
      return;
    }

    // Build routing code from address
    const routingCode = buildRoutingCode(
      element.address.zip5,
      element.address.zip4,
      element.address.deliveryPoint
    );

    // Generate serial number based on mailer ID length
    const serialLength = savedMailerId.length === 6 ? 9 : 6;
    const serial = Math.floor(Math.random() * Math.pow(10, serialLength))
      .toString()
      .padStart(serialLength, '0');

    // Add IMb element to the label with all config
    addElement('imbarcode', {
      barcodeId: '00',
      serviceTypeId: '001',
      mailerId: savedMailerId,
      serialNumber: serial,
      routingCode,
    });

    setValidationError(null);
  };

  const hasValidMailerId = savedMailerId && (savedMailerId.length === 6 || savedMailerId.length === 9);
  const canGenerateIMb = element.address.zip5 && hasValidMailerId;

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
          onClick={handleGenerateIMb}
          disabled={!canGenerateIMb}
          title={!hasValidMailerId ? 'Configure Mailer ID in Settings first' : !element.address.zip5 ? 'Enter ZIP code first' : undefined}
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

      {!hasValidMailerId && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-warning/10 text-warning-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            Configure your Mailer ID in Settings to generate IMb barcodes.
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

    </div>
  );
}
