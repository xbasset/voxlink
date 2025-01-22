import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid'
import { FC } from 'react'
import { User } from '../types/db';
import PlaceHolder from './PlaceHolder';

interface ProfileHeaderProps {
  className?: string
  user: User | null
}

const ProfileHeader: FC<ProfileHeaderProps> = ({ className, user }) => {
  if (!user) {
    return <PlaceHolder />;
  }
  return (
    <div className={className}>
      <div>
        <img alt="" src={user.backgroundImage} className="h-32 w-screen object-cover lg:h-48" />
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
          <div className="flex">
            <img alt="" src={user.avatar} className="size-24 ml-4 rounded-full ring-4 ring-white sm:size-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
