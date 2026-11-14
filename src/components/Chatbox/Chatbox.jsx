import React from 'react'
import './Chatbox.css'
import assets from '../../assets/assets'

const Chatbox = () => {

  const { userData, messageId, chatUser, messages, setMessages } = useContext(AppContext);

  const [input, setInput] = useState("");

  useEffect(() => {
    if (messageId) {
      const unSub = onSnapshot(doc(db, 'messagesId'), (res) =>)
      setMessages(res.data(), messages.reverse())
      console.log(res.data(), messages.reverse());
    })
  return () => {
    unSub();
  }
}
  }, [messagesId])

return chatUser ? (
  <div className="chat-box">
    <div className="chat-user">
      <img src={chatUser.userData.avatar} alt="" />
      <p>{chatUser.userData.name} <img className='dot' src={assets.green_dot} alt="" /></p>
      <img src={assets.help_icon} className='help' alt="" />
    </div>

    <div className="chat-msg">
      <div className="s-msg">
        <p className="msg">Hi message is commonly used in...</p>
        <div>
          <img src={assets.profile_img} alt="" />
          <p>2:30 PM</p>
        </div>
      </div>
      <div className="s-msg">
        <img className='msg-img' src={assets.pic1} alt="" />
        <div>
          <img src={assets.profile_img} alt="" />
          <p>2:30 PM</p>
        </div>
      </div>
      <div className="r-msg">
        <p className="msg">Hi message is commonly used in...</p>
        <div>
          <img src={assets.profile_img} alt="" />
          <p>2:30 PM</p>
        </div>
      </div>
    </div>



    <div className="chat-input">
      <input type="text" placeholder='Send a message' />
      <input type="file" id='image' accept='image/png, image/jpeg' hidden />
      <label htmlFor="image">
        <img src={assets.gallery_icon} alt="" />
      </label>
      <img src={assets.send_button} alt="" />
    </div>
  </div>
)
  : <div className='chat-welcome'>
    <img src={assets.log_icon} alt="" />
    <p>Chat anytime, anywhere</p>
  </div>
}

export default Chatbox