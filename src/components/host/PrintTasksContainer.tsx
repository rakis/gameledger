import React from 'react';
import { PrintablePageItem } from '../../utils/printTasks';

interface PrintTasksContainerProps {
  pages: PrintablePageItem[];
  fontSizePt: number;
}

export const PrintTasksContainer: React.FC<PrintTasksContainerProps> = ({
  pages,
  fontSizePt,
}) => {
  return (
    <div id="gameledger-print-root" className="print-only">
      {pages.map((page) => (
        <div key={page.id} className="print-page">
          <div
            className="print-page-content"
            style={{ fontSize: `${fontSizePt}pt` }}
          >
            {/* Optional Title / Part Header */}
            {page.renderedTitle && (
              <h1
                className="print-page-title font-bold mb-8"
                style={{ fontSize: `${Math.round(fontSizePt * 1.15)}pt` }}
              >
                {page.renderedTitle}
              </h1>
            )}

            {/* Task Brief Content */}
            <div className="print-page-brief font-medium tracking-wide">
              {page.renderedBrief}
            </div>

            {/* Time limit statement if applicable */}
            {page.timeLimitNotice && (
              <div className="print-page-brief mt-8 font-medium">
                {page.timeLimitNotice}
              </div>
            )}

            {/* Authentic "Your time starts now." cue */}
            {page.timeStartsNotice && (
              <div className="print-page-brief mt-4 font-bold">
                {page.timeStartsNotice}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
