import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { ApprovalWorkflow } from '../types';
import { formatDateTime } from '../lib/utils';

interface ApprovalWorkflowStatusProps {
  workflow: ApprovalWorkflow;
}

const ApprovalWorkflowStatus = ({ workflow }: ApprovalWorkflowStatusProps) => {
  if (!workflow.steps || workflow.steps.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Kein Genehmigungsworkflow konfiguriert
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Genehmigt';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return 'Ausstehend';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Genehmigungsworkflow</h3>

      <div className="space-y-4">
        {workflow.steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex-shrink-0 pt-1">{getStatusIcon(step.status)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Schritt {step.order + 1}
                  {step.approver && (
                    <span className="text-gray-600 ml-2">
                      - {step.approver.firstName} {step.approver.lastName}
                    </span>
                  )}
                </h4>
                <span
                  className={`text-xs font-medium ${
                    step.status === 'approved'
                      ? 'text-green-600'
                      : step.status === 'rejected'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {getStatusLabel(step.status)}
                </span>
              </div>

              {step.comment && (
                <p className="text-sm text-gray-600 mb-2">{step.comment}</p>
              )}

              {step.approvedAt && (
                <p className="text-xs text-gray-500">
                  Genehmigt am {formatDateTime(step.approvedAt)}
                </p>
              )}

              {step.rejectedAt && (
                <p className="text-xs text-gray-500">
                  Abgelehnt am {formatDateTime(step.rejectedAt)}
                </p>
              )}
            </div>

            {index < workflow.steps.length - 1 && (
              <div className="absolute left-3 mt-8 h-full w-px bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Gesamtstatus:
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              workflow.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : workflow.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {getStatusLabel(workflow.status)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ApprovalWorkflowStatus;
