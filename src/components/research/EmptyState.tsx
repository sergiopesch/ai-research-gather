import { FileText } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-6">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          Ready to explore research?
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Select your research areas above and click the discover button to find today's latest papers with intelligent insights.
        </p>
      </div>
    </div>
  );
};