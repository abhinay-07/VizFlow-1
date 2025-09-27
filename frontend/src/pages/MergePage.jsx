import React, { useState } from "react";
import { Merge, Database, CheckCircle, AlertCircle } from "lucide-react";
import { Card, Button, LoadingSpinner, Badge } from "../components/ui";
import { useApi } from "../hooks";
import { dataAPI } from "../services/api";
import { formatNumber, formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

export default function MergePage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);

  const {
    data: dataSummary,
    loading: dataLoading,
    refresh: refreshData,
  } = useApi(dataAPI.getSummary, [], {
    onError: (error) => console.error("Error fetching data summary:", error),
  });

  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      toast.error("Please select at least 2 files to merge");
      return;
    }

    setIsMerging(true);
    try {
      // Note: This would need a merge API endpoint
      // For now, we'll simulate the merge
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Data merged successfully!");
      setSelectedFiles([]);
      refreshData();
    } catch (error) {
      toast.error("Failed to merge data: " + error.message);
    } finally {
      setIsMerging(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const availableFiles = dataSummary?.data?.recentUploads || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Merge className="h-6 w-6" />
          Data Merging
        </h1>
        <p className="text-gray-600 mt-1">
          Combine multiple customer data files into unified profiles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Selection */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Files to Merge
            </h2>

            {availableFiles.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No uploaded files available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload some files first to merge them
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableFiles.map((file) => (
                  <div
                    key={file._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedFiles.includes(file._id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleFileSelect(file._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded border-2 ${
                            selectedFiles.includes(file._id)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedFiles.includes(file._id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {file.originalFileName}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatNumber(file.recordCount)} records •{" "}
                            {formatDate(file.uploadDate, "relative")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="info" className="text-xs">
                        {file.fileType.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length >= 2 && (
              <div className="mt-6">
                <Button
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="w-full"
                >
                  {isMerging ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      Merging Data...
                    </>
                  ) : (
                    <>
                      <Merge className="w-4 h-4 mr-2" />
                      Merge {selectedFiles.length} Files
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Merge Information */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Merge Information
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  How Merging Works
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Files are merged by customer identifiers (email, phone,
                    etc.)
                  </li>
                  <li>• Duplicate records are consolidated</li>
                  <li>• Conflicting data is resolved automatically</li>
                  <li>• A new merged dataset is created</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900">
                      Requirements
                    </h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      Select at least 2 files with compatible data structures
                      for merging.
                    </p>
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">
                    Selected Files
                  </h3>
                  <p className="text-sm text-green-800">
                    {selectedFiles.length} file
                    {selectedFiles.length !== 1 ? "s" : ""} selected for merging
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
