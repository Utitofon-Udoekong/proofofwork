"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Web3Service } from "@/app/lib/web3Service";
import { EntryType } from "@/app/lib/types";

export default function CreateEntryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [web3Service, setWeb3Service] = useState<Web3Service | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
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

  useEffect(() => {
    const initializeWeb3 = async () => {
      const service = new Web3Service();
      const { isConnected } = await service.initialize();
      
      setWeb3Service(service);
      setIsWalletConnected(isConnected);
    };
    
    initializeWeb3();
  }, []);

  const handleConnectWallet = async () => {
    if (web3Service) {
      try {
        const { isConnected } = await web3Service.connectWallet();
        setIsWalletConnected(isConnected);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert("Failed to connect wallet. Please make sure you have MetaMask installed.");
      }
    }
  };

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

      if (!web3Service || !isWalletConnected) {
        alert("Please connect your wallet first");
        setIsSubmitting(false);
        return;
      }

      // Create a resume if the user doesn't have one
      if (!web3Service.tokenId) {
        try {
          await web3Service.createResume("");
          console.log("Resume created with token ID:", web3Service.tokenId);
        } catch (error) {
          console.error("Error creating resume:", error);
          alert("Failed to create resume. Please try again.");
          setIsSubmitting(false);
          return;
        }
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

      const result = await web3Service.addResumeEntry(entryDataToSubmit);

      console.log("Entry added:", result);
      
      // Redirect back to dashboard after successful submission
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Error submitting entry:", error);
      alert("Failed to create entry. Please try again.");
      setIsSubmitting(false);
    }
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Resume Entry</h1>
        <p className="text-gray-600 mt-2">Create a new entry for your on-chain resume</p>
      </div>

      {!isWalletConnected ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
          <p className="mb-4">Connect your wallet to add resume entries</p>
          <button
            onClick={handleConnectWallet}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
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
      )}
    </div>
  );
} 