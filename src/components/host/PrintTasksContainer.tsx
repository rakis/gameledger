import React from 'react';
import { PrintablePageItem, PrintOptions } from '../../utils/printTasks';

interface PrintTasksContainerProps {
  pages: PrintablePageItem[];
  fontSize: PrintOptions['fontSize'];
}

export const PrintTasksContainer: React.FC<PrintTasksContainerProps> = ({
  pages,
  fontSize,
}) => {
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'normal':
        return 'text-lg leading-relaxed';
      case 'xlarge':
        return 'text-3xl leading-relaxed';
      case 'large':
      default:
        return 'text-2xl leading-relaxed';
    }
  };

  return (
    <div id="gameledger-print-root" className="print-only">
      {pages.map((page) => (
        <div key={page.id} className="print-page">
          <div className="print-page-content">
            {/* Optional Title / Part Header */}
            {page.renderedTitle && (
              <h1 className="print-page-title text-xl md:text-2xl font-bold mb-8">
                {page.renderedTitle}
              </h1>
            )}

            {/* Task Brief Content */}
            <div className={`print-page-brief font-medium tracking-wide ${getFontSizeClass()}`}>
              {page.renderedBrief}
            </div>

            {/* Time limit statement if applicable */}
            {page.timeLimitNotice && (
              <div className={`print-page-brief mt-8 font-medium ${getFontSizeClass()}`}>
                {page.timeLimitNotice}
              </div>
            )}

            {/* Authentic "Your time starts now." cue */}
            {page.timeStartsNotice && (
              <div className={`print-page-brief mt-4 font-bold ${getFontSizeClass()}`}>
                {page.timeStartsNotice}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
