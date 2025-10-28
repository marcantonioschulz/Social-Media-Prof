import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { usePendingApprovals, useProcessApproval } from '../hooks/useApprovals';
import { useCurrentUser } from '../hooks/useAuth';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { formatDateTime } from '../lib/utils';
import type { ApprovalWorkflow, ApprovalStep } from '../types';

const ApprovalsPage = () => {
  const [page, setPage] = useState(1);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [selectedStep, setSelectedStep] = useState<ApprovalStep | null>(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState<'approved' | 'rejected' | null>(null);

  const user = useCurrentUser();
  const { data, isLoading } = usePendingApprovals({ page, limit: 10 });
  const processApprovalMutation = useProcessApproval(
    selectedWorkflow?.id || '',
    selectedStep?.id || ''
  );

  const handleApprove = () => {
    if (!selectedWorkflow || !selectedStep) return;
    setIsProcessing('approved');
    processApprovalMutation.mutate(
      { status: 'approved', comment },
      {
        onSettled: () => {
          setIsProcessing(null);
          setSelectedWorkflow(null);
          setSelectedStep(null);
          setComment('');
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedWorkflow || !selectedStep) return;
    if (!comment.trim()) {
      alert('Bitte geben Sie einen Ablehnungsgrund an');
      return;
    }
    setIsProcessing('rejected');
    processApprovalMutation.mutate(
      { status: 'rejected', comment },
      {
        onSettled: () => {
          setIsProcessing(null);
          setSelectedWorkflow(null);
          setSelectedStep(null);
          setComment('');
        },
      }
    );
  };

  const canApprove = (step: ApprovalStep) => {
    return user && step.approverId === user.id && step.status === 'pending';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Genehmigungen</h1>
        <p className="text-gray-600">
          Überprüfen und genehmigen Sie ausstehende Posts
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <>
          <div className="space-y-6">
            {data.data.map((workflow) => {
              const post = workflow.post;
              if (!post) return null;

              const pendingSteps = workflow.steps?.filter(
                (step) => step.status === 'pending' && canApprove(step)
              );

              return (
                <div
                  key={workflow.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link to={`/posts/${post.id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="text-gray-600 mt-2 line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Ausstehend
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>Erstellt: {formatDateTime(post.createdAt)}</span>
                      <span>•</span>
                      <span>
                        Von: {post.user?.firstName} {post.user?.lastName}
                      </span>
                      <span>•</span>
                      <span>{post.platforms.join(', ')}</span>
                    </div>

                    {/* Approval Steps */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Genehmigungsschritte:
                      </h4>
                      <div className="space-y-2">
                        {workflow.steps?.map((step) => (
                          <div
                            key={step.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {step.status === 'approved' && (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              )}
                              {step.status === 'rejected' && (
                                <XCircleIcon className="h-5 w-5 text-red-500" />
                              )}
                              {step.status === 'pending' && (
                                <div className="h-5 w-5 rounded-full border-2 border-yellow-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {step.approver?.firstName} {step.approver?.lastName}
                                </p>
                                {step.comment && (
                                  <p className="text-sm text-gray-600">{step.comment}</p>
                                )}
                              </div>
                            </div>
                            {canApprove(step) && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedWorkflow(workflow);
                                  setSelectedStep(step);
                                }}
                              >
                                Prüfen
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Zurück
              </Button>
              <span className="text-sm text-gray-600">
                Seite {page} von {data.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CheckCircleIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Keine ausstehenden Genehmigungen</p>
        </div>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={!!selectedWorkflow && !!selectedStep}
        onClose={() => {
          setSelectedWorkflow(null);
          setSelectedStep(null);
          setComment('');
        }}
        title="Post überprüfen"
        size="lg"
      >
        {selectedWorkflow?.post && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {selectedWorkflow.post.title}
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedWorkflow.post.content}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kommentar (optional bei Genehmigung, erforderlich bei Ablehnung)
              </label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ihr Kommentar..."
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handleApprove}
                isLoading={isProcessing === 'approved'}
                disabled={!!isProcessing}
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Genehmigen
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={isProcessing === 'rejected'}
                disabled={!!isProcessing}
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Ablehnen
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedWorkflow(null);
                  setSelectedStep(null);
                  setComment('');
                }}
                disabled={!!isProcessing}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalsPage;
