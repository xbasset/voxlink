import React, { useState, useEffect, useRef } from "react";
import ProfileHeader from "../components/ProfileHeader";
import { CallFlowButton } from "../components/call/CallFlowButton";
import { CallFlowModal } from "../components/call/CallFlowModal";
import PlaceHolder from "../components/PlaceHolder";
import { User, CallTranscriptEntry } from "../types/db";
import { CallFlowProvider } from "../components/call/CallFlowProvider";

const Home: React.FC = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error(`Error fetching user data: ${response.statusText}`);
        }
        const data: User = await response.json();
        setUserData(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handler to open the call modal
  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  // Handler to close the call modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  // Handler to process transcript after call ends
  const handleStopCall = async (transcript: CallTranscriptEntry[]) => {
    if (userData) {
      try {
        await fetch("/api/calls", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            duration: transcript.reduce((acc, entry) => acc + 1, 0), // Example duration calculation
            userId: userData.id,
            details: {
              name: transcript.find((t) => t.from === "user")?.content || "",
              reason: transcript.find((t) => t.from === "assistant")?.content || "",
              email: userData.email,
              phone: userData.phone,
            },
            transcript,
          }),
        });
      } catch (err) {
        console.error("Failed to save call:", err);
      }
    }
    handleCloseModal();
  };

  if (loading) {
    return <PlaceHolder />;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <CallFlowProvider user={userData}>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-gray-800">
        <ProfileHeader user={userData} />
        <div className="bg-white px-6 py-4 lg:px-8 w-full max-w-4xl">
          <div className="mx-auto max-w-3xl text-base text-gray-700">
            <p className="text-base font-semibold text-indigo-600">Personal Website</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 items-center justify-between mt-4">
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {userData?.name}
              </h1>
              <CallFlowButton user={userData} pulse={false} />
            </div>
            <p className="mt-6 text-xl">
              {userData?.shortBio}
            </p>
            <div className="mt-10 max-w-2xl">
              <p>
                Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae
                sed turpis id. Id dolor praesent donec est. Odio penatibus risus viverra tellus varius sit neque erat velit.
                Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae
                sed turpis id.
              </p>
              <p className="mt-8">
                Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor
                fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac
                adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.
              </p>
            </div>
          </div>
        </div>

        {/* Call Flow Modal */}
        <CallFlowModal />
      </div>
    </CallFlowProvider>
  );
};

export default Home;
