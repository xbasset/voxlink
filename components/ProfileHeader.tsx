import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid'
import { FC } from 'react'
import { User } from '../types/user';
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
        <img alt="" src={user.backgroundImage} className="h-32 w-full object-cover lg:h-48" />
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
          <div className="flex">
            <img alt="" src={user.avatar} className="size-24 rounded-full ring-4 ring-white sm:size-32" />
          </div>
          <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="mt-6 min-w-0 flex-1 sm:hidden md:block">
              <h1 className="truncate text-2xl font-bold text-gray-900">{user.name}</h1>
            </div>
            <div className="mt-6 flex flex-col w-svw">

            </div>
          </div>
        </div>
        <div className="mt-6 hidden min-w-0 flex-1 sm:block md:hidden">
          <h1 className="truncate text-2xl font-bold text-gray-900">{user.name}</h1>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
