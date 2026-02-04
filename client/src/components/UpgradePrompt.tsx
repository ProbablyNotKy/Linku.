import { Link } from 'wouter';
import { Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
}

export function UpgradePrompt({
  isOpen,
  onClose,
  featureName,
  featureDescription,
}: UpgradePromptProps) {
  const premiumFeatures = [
    'AI-powered scholarship matching',
    'Socratic Mentor for essay guidance',
    'Priority customer support',
    'Unlimited searches & filters',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-upgrade-prompt">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="w-6 h-6 text-amber-500" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            {featureDescription || `${featureName} is a premium feature.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Premium Benefits
            </h4>
            <ul className="space-y-2">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              RM 29.90<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/subscription" onClick={onClose}>
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
              data-testid="button-upgrade-now"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            onClick={onClose}
            data-testid="button-maybe-later"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PremiumBadgeProps {
  className?: string;
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white ${className}`}
      data-testid="badge-premium"
    >
      <Crown className="w-3 h-3" />
      Premium
    </span>
  );
}

interface SubscriptionStatusProps {
  tier: 'free' | 'premium';
  expiresAt?: string | null;
}

export function SubscriptionStatus({ tier, expiresAt }: SubscriptionStatusProps) {
  if (tier === 'premium') {
    const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800" data-testid="status-subscription-premium">
        <Crown className="w-5 h-5 text-amber-500" />
        <div>
          <p className="font-medium text-foreground">Premium Member</p>
          {expiryDate && (
            <p className="text-xs text-muted-foreground">Valid until {expiryDate}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 border" data-testid="status-subscription-free">
      <div>
        <p className="font-medium text-foreground">Free Plan</p>
        <p className="text-xs text-muted-foreground">Upgrade to unlock all features</p>
      </div>
      <Link href="/subscription">
        <Button size="sm" variant="outline" data-testid="button-upgrade-from-status">
          <Crown className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </Link>
    </div>
  );
}
