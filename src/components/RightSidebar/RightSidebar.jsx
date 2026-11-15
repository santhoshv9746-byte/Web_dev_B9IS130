import { useContext } from 'react'
import './RightSidebar.css'
import assets from '../../assets/assets'
import { logout } from '../../config/firebase'
import { AppContext } from '../../context/AppContext'

const RightSidebar = () => {

  const { chatUser, messages, isChatUserOnline } = useContext(AppContext);

  const msgImages = messages
    .filter((msg) => msg.image)
    .map((msg) => msg.image);

  return chatUser?.userData ? (
    <div className='rs'>
      <div className="rs-profile">


        <img
          src={chatUser.userData.avatar || assets.avatar_icon}
          alt="Profile"
        />

        <h3>
          {chatUser.userData.name}

          {isChatUserOnline ? (
            <img
              src={assets.green_dot}
              className="dot"
              alt="Online"
            />
          ) : null}
        </h3>

        <p>{chatUser.userData.bio}</p>


      </div>
      <hr />
      <div className="rs-media">
        <p>Media</p>
        <div>
          {msgImages.map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={url} alt="Shared media" />
            </a>
          ))}
        </div>
      </div>

      <button onClick={logout}>Logout</button>

    </div>
  )
    : (
      <div className='rs'>
        <button onClick={logout}>Logout</button>
      </div>
    )
}

export default RightSidebar