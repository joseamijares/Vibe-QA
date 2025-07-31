import * as React from 'react';
import { cn } from '@/lib/utils';

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
  }
>(({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || '');

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div ref={ref} className={cn('w-full', className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            value: value || selectedValue,
            onValueChange: handleValueChange,
          });
        }
        return child;
      })}
    </div>
  );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
  }
>(({ className, value, children, ...props }, ref) => {
  const parent = React.useContext(TabsContext);
  const isSelected = parent?.value === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => parent?.onValueChange?.(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected ? 'bg-background text-foreground shadow-sm' : 'hover:bg-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
  }
>(({ className, value, ...props }, ref) => {
  const parent = React.useContext(TabsContext);
  const isSelected = parent?.value === value;

  if (!isSelected) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';

// Create context for tabs
const TabsContext = React.createContext<{
  value: string;
  onValueChange?: (value: string) => void;
} | null>(null);

// Update Tabs component to use context
const TabsWithContext = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
  }
>(({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || '');
  const currentValue = value || selectedValue;

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

export { TabsWithContext as Tabs, TabsList, TabsTrigger, TabsContent };
