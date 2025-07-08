import { FileText } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="text-center py-12 sm:py-16 lg:py-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="p-3 sm:p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4 sm:mb-6">
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
          Ready to explore research?
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Select your research areas above and click the discover button to find today's latest papers with intelligent insights.
        </p>
      </div>
    </div>
  );
};