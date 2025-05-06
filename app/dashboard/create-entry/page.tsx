"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "@/app/providers/Web3Provider";
import { EntryType } from "@/app/lib/types";

export default function CreateEntryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    walletConnected, 
    tokenId, 
    tokenIds,
    resumeNames,
    connectWallet, 
    addResumeEntry,
    createNewResume,
    selectResume,
    isLoading 
  } = useWeb3();
  const [entryType, setEntryType] = useState<EntryType>('work');
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    startDate: "",
    endDate: "",
    organization: "",
    // Education fields
    degree: "",
    fieldOfStudy: "",
    grade: "",
    // Certification fields
    issuedBy: "",
    credentialID: "",
    expirationDate: "",
    // Work fields
    role: "",
    location: "",
    // Project fields
    projectUrl: "",
    // Skill fields
    proficiencyLevel: ""
  });

  const handleChangeType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEntryType(e.target.value as EntryType);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.title || !formData.company || !formData.startDate) {
        alert("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      if (!walletConnected) {
        alert("Please connect your wallet first");
        setIsSubmitting(false);
        return;
      }

      // Add the resume entry
      const entryDataToSubmit = {
        type: entryType,
        title: formData.title,
        company: formData.company,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || "",
        organization: formData.organization || formData.company
      };

      // Add type-specific fields
      if (entryType === 'education') {
        Object.assign(entryDataToSubmit, {
          degree: formData.degree,
          fieldOfStudy: formData.fieldOfStudy,
          grade: formData.grade
        });
      } else if (entryType === 'certification') {
        Object.assign(entryDataToSubmit, {
          issuedBy: formData.issuedBy,
          credentialID: formData.credentialID,
          expirationDate: formData.expirationDate
        });
      } else if (entryType === 'work') {
        Object.assign(entryDataToSubmit, {
          role: formData.role,
          location: formData.location
        });
      } else if (entryType === 'project') {
        Object.assign(entryDataToSubmit, {
          projectUrl: formData.projectUrl
        });
      } else if (entryType === 'skill') {
        Object.assign(entryDataToSubmit, {
          proficiencyLevel: formData.proficiencyLevel
        });
      }

      const result = await addResumeEntry(entryDataToSubmit);

      console.log("Entry added:", result);
      
      // Redirect back to dashboard after successful submission
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Error submitting entry:", error);
      alert("Failed to create entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateResume = async () => {
    try {
      await createNewResume("My Professional Resume");
    } catch (error) {
      console.error("Error creating new resume:", error);
      alert("Failed to create a new resume. Please try again.");
    }
  };

  // Helper to get resume name
  const getResumeName = (id: bigint): string => {
    const idStr = id.toString();
    return resumeNames[idStr]?.name || `Resume #${idStr}`;
  };

  // Function to render different form fields based on entry type
  const renderTypeSpecificFields = () => {
    switch (entryType) {
      case 'work':
        return (
          <>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Job Role
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Senior Developer"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. New York, Remote"
              />
            </div>
          </>
        );
        
      case 'education':
        return (
          <>
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
                Degree <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Bachelor of Science"
                required
              />
            </div>
            <div>
              <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 mb-1">
                Field of Study <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fieldOfStudy"
                name="fieldOfStudy"
                value={formData.fieldOfStudy}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Computer Science"
                required
              />
            </div>
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                Grade/GPA
              </label>
              <input
                type="text"
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 3.8/4.0"
              />
            </div>
          </>
        );
        
      case 'certification':
        return (
          <>
            <div>
              <label htmlFor="issuedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Issued By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="issuedBy"
                name="issuedBy"
                value={formData.issuedBy}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. AWS, Microsoft"
                required
              />
            </div>
            <div>
              <label htmlFor="credentialID" className="block text-sm font-medium text-gray-700 mb-1">
                Credential ID
              </label>
              <input
                type="text"
                id="credentialID"
                name="credentialID"
                value={formData.credentialID}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. ABC123456"
              />
            </div>
            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                id="expirationDate"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mt-1 text-xs text-gray-500">Leave blank if no expiration</div>
            </div>
          </>
        );
        
      case 'project':
        return (
          <div>
            <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Project URL
            </label>
            <input
              type="url"
              id="projectUrl"
              name="projectUrl"
              value={formData.projectUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. https://github.com/username/project"
            />
          </div>
        );
        
      case 'skill':
        return (
          <div>
            <label htmlFor="proficiencyLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Proficiency Level
            </label>
            <select
              id="proficiencyLevel"
              name="proficiencyLevel"
              value={formData.proficiencyLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Get label for company/organization field based on entry type
  const getCompanyLabel = () => {
    switch(entryType) {
      case 'work': return 'Company';
      case 'education': return 'Institution';
      case 'certification': return 'Issuing Organization';
      case 'project': return 'Associated Organization';
      case 'skill': return 'Related Organization';
      case 'award': return 'Awarding Organization';
      default: return 'Organization';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Add Resume Entry</h1>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>
      
      {!walletConnected ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to add entries to your resume.
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
          >
            Connect Wallet
          </button>
        </div>
      ) : !tokenId ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold mb-4">No Resume Selected</h2>
          <p className="text-gray-600 mb-6">
            You need to create a resume before you can add entries.
          </p>
          <button
            onClick={handleCreateResume}
            disabled={isLoading}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Creating..." : "Create New Resume"}
          </button>
        </div>
      ) : (
        <>
          {/* Resume selector if multiple resumes exist */}
          {tokenIds.length > 1 && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Select Resume</h2>
              <p className="text-sm text-gray-600 mb-3">
                Choose which resume to add this entry to:
              </p>
              <div className="flex flex-wrap gap-2">
                {tokenIds.map((id) => (
                  <button
                    key={String(id)}
                    onClick={() => selectResume(id)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                      tokenId === id
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {getResumeName(id)}
                  </button>
                ))}
              </div>
            </div>
          )}
        
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
            {/* Form heading showing which resume this entry is for */}
            <div className="pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Adding to: {getResumeName(tokenId)}</h2>
              <p className="text-sm text-gray-600">
                Resume ID: {tokenId.toString()}
              </p>
            </div>
            
            <div>
              <label htmlFor="entryType" className="block text-sm font-medium text-gray-700 mb-1">
                Entry Type <span className="text-red-500">*</span>
              </label>
              <select
                id="entryType"
                name="entryType"
                value={entryType}
                onChange={handleChangeType}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="work">Work Experience</option>
                <option value="education">Education</option>
                <option value="certification">Certification</option>
                <option value="project">Project</option>
                <option value="skill">Skill</option>
                <option value="award">Award</option>
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`e.g. ${entryType === 'work' ? 'Software Engineer' : 
                               entryType === 'education' ? 'Computer Science Degree' : 
                               entryType === 'certification' ? 'AWS Certified Developer' : 
                               entryType === 'project' ? 'E-commerce Website' : 
                               entryType === 'skill' ? 'JavaScript' : 'Excellence in Technology Award'}`}
                required
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                {getCompanyLabel()} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`e.g. ${entryType === 'work' ? 'Tech Solutions Inc.' : 
                               entryType === 'education' ? 'Stanford University' : 
                               entryType === 'certification' ? 'AWS' : 
                               entryType === 'project' ? 'Personal Project' : 
                               entryType === 'skill' ? 'Self-Taught' : 'Industry Association'}`}
                required
              />
            </div>

            {/* Render type-specific fields */}
            {renderTypeSpecificFields()}

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Describe your ${entryType}`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-1 text-xs text-gray-500">Leave blank if {entryType === 'work' ? 'current position' : entryType === 'education' ? 'currently enrolled' : 'ongoing'}</div>
              </div>
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                Verifying Organization (optional)
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the name of organization that can verify this entry"
              />
              <div className="mt-1 text-xs text-gray-500">
                This should be an organization registered on our platform that can verify your experience
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  "Save Entry"
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
} 