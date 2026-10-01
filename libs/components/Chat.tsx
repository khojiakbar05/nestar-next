// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import { Avatar, Box, Stack } from '@mui/material';
// import SendIcon from '@mui/icons-material/Send';
// import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
// import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
// import { useRouter } from 'next/router';
// import ScrollableFeed from 'react-scrollable-feed';
// import { RippleBadge } from '../../scss/MaterialTheme/styled';
// import { userVar } from '../../apollo/store';
// import { useReactiveVar } from '@apollo/client';
// import { Member } from '../types/member/member';
// import { Messages, REACT_APP_API_URL } from '../config';
// import { sweetErrorAlert } from '../sweetAlert';
// import { getJwtToken } from '../auth';

// const NewMessage = (type: any) => {
// 	if (type === 'right') {
// 		return (
// 			<Box
// 				component={'div'}
// 				flexDirection={'row'}
// 				style={{ display: 'flex' }}
// 				alignItems={'flex-end'}
// 				justifyContent={'flex-end'}
// 				sx={{ m: '10px 0px' }}
// 			>
// 				<div className={'msg_right'}></div>
// 			</Box>
// 		);
// 	} else {
// 		return (
// 			<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
// 				<Avatar alt={'jonik'} src={'/img/profile/defaultUser.svg'} />
// 				<div className={'msg_left'}></div>
// 			</Box>
// 		);
// 	}
// };


// interface MessagePayload {
// 	event: string;
// 	text: string;
// 	memberData: Member | null;
// }

// interface InfoPayload {
// 	event: string;
// 	totalClients: number;
// 	memberData: Member | null;
// 	action: string;
// }

// const Chat = () => {
// 	const chatContentRef = useRef<HTMLDivElement>(null);
// 	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
// 	const [onlineUsers, setOnlineUsers] = useState<number>(4);
// 	const [messageInput, setMessageInput] = useState<string>('');
// 	const [open, setOpen] = useState(false);
// 	const [openButton, setOpenButton] = useState(false);
// 	const chatSocketRef = useRef<WebSocket | null>(null);
// 	const router = useRouter();
// 	const user = useReactiveVar(userVar);
// 	const authToken = getJwtToken() ?? '';

// 	/** LIFECYCLES **/

// 	useEffect(() => {
// 		const socketUrl = new URL(process.env.REACT_APP_API_WS ?? process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:3007');
// 		if (socketUrl.protocol === 'http:') socketUrl.protocol = 'ws:';
// 		if (socketUrl.protocol === 'https:') socketUrl.protocol = 'wss:';
// 		if (authToken) socketUrl.searchParams.set('Token', authToken);
// 		const chatSocket = new WebSocket(socketUrl.toString());
// 		chatSocketRef.current = chatSocket;

// 		chatSocket.onmessage = (msg) => {
// 			const data = JSON.parse(msg.data);

// 			switch (data.event) {
// 				case 'info': {
// 					const newInfo: InfoPayload = data;
// 					setOnlineUsers(newInfo.totalClients);
// 					break;
// 				}
// 				case 'getMessages': {
// 					const list: MessagePayload[] = data.list;
// 					setMessagesList(Array.isArray(list) ? list : []);
// 					break;
// 				}
// 				case 'message': {
// 					const newMessage: MessagePayload = data;
// 					setMessagesList((currentMessages) => [...currentMessages, newMessage]);
// 					break;
// 				}
// 			}
// 		};

// 		return () => {
// 			chatSocket.onmessage = null;
// 			if (chatSocket.readyState < WebSocket.CLOSING) chatSocket.close();
// 			if (chatSocketRef.current === chatSocket) chatSocketRef.current = null;
// 		};
// 	}, [authToken, user?._id]);

// 	useEffect(() => {
// 		const timeoutId = setTimeout(() => {
// 			setOpenButton(true);
// 		}, 100);
// 		return () => clearTimeout(timeoutId);
// 	}, []);

// 	useEffect(() => {
// 		setOpenButton(false);
// 	}, [router.pathname]);

// 	/** HANDLERS **/
// 	const handleOpenChat = () => {
// 		setOpen((prevState) => !prevState);
// 	};

// 	const getInputMessageHandler = useCallback(
// 		(e: any) => {
// 			const text = e.target.value;
// 			setMessageInput(text);
// 		},
// 		[messageInput],
// 	);

// 	const getKeyHandler = (e: any) => {
// 		try {
// 			if (e.key == 'Enter') {
// 				onClickHandler();
// 			}
// 		} catch (err: any) {
// 			console.log(err);
// 		}
// 	};

// 	const onClickHandler = () => {
// 		if (!messageInput) sweetErrorAlert(Messages.error4);
// 		else {
// 			const socket = chatSocketRef.current;
// 			if (!socket || socket.readyState !== WebSocket.OPEN) {
// 				sweetErrorAlert(Messages.error1);
// 				return;
// 			}
// 			socket.send(JSON.stringify({ event: 'message', data: messageInput }));
// 			setMessageInput('');
// 		}
// 	};

// 	return (
// 		<Stack className="chatting">
// 			{openButton ? (
// 				<button className="chat-button" onClick={handleOpenChat}>
// 					{open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
// 				</button>
// 			) : null}
// 			<Stack className={`chat-frame ${open ? 'open' : ''}`}>
// 				<Box className={'chat-top'} component={'div'}>
// 					<div style={{ fontFamily: 'Nunito' }}>Online Chat</div>
// 					<RippleBadge style={{ margin: '-18px 0 0 21px' }} badgeContent={onlineUsers} />
// 				</Box>
// 				<Box className={'chat-content'} id="chat-content" ref={chatContentRef} component={'div'}>
// 					<ScrollableFeed>
// 						<Stack className={'chat-main'}>
// 							<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
// 								<div className={'welcome'}>Welcome to Live chat!</div>
// 							</Box>
// 							{messagesList.map((ele: MessagePayload) => {
// 								const { text, memberData } = ele;
// 								const senderId = normalizeMemberId(memberData?._id);
// 								const currentUserId = normalizeMemberId(user?._id);
// 								const isOwnMessage = currentUserId !== '' && senderId !== '' && senderId === currentUserId;
// 								const memberImage = memberData?.memberImage
// 									? `${REACT_APP_API_URL}/${memberData.memberImage}`
// 									: '/img/profile/defaultUser.svg';

// 								return isOwnMessage ? (
// 									<Box
// 										component={'div'}
// 										flexDirection={'row'}
// 										style={{ display: 'flex' }}
// 										alignItems={'flex-end'}
// 										justifyContent={'flex-end'}
// 										sx={{ m: '10px 0px' }}
// 									>
// 										<div className={'msg-right'}>{text}</div>
// 									</Box>
// 								) : (
// 									<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
// 										<Avatar alt={'jonik'} src={memberImage} />
// 										<div className={'msg-left'}>{text}</div>
// 									</Box>
// 								);
// 							})}
// 							<></>
// 						</Stack>
// 					</ScrollableFeed>
// 				</Box>
// 				<Box className={'chat-bott'} component={'div'}>
// 					<input
// 						type={'text'}
// 						name={'message'}
// 						className={'msg-input'}
// 						placeholder={'Type message'}
// 						value={messageInput}
// 						onChange={getInputMessageHandler}
// 						onKeyDown={getKeyHandler}
// 					/>
// 					<button className={'send-msg-btn'} onClick={onClickHandler}>
// 						<SendIcon style={{ color: '#fff' }} />
// 					</button>
// 				</Box>
// 			</Stack>
// 		</Stack>
// 	);
// };

// export default Chat;


import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Box, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import { RippleBadge } from '../../scss/MaterialTheme/styled';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { Member } from '../types/member/member';
import { Messages, REACT_APP_API_URL } from '../config';
import { sweetErrorAlert } from '../sweetAlert';
import { getJwtToken } from '../auth';

const NewMessage = (type: any) => {
	if (type === 'right') {
		return (
			<Box
				component={'div'}
				flexDirection={'row'}
				style={{ display: 'flex' }}
				alignItems={'flex-end'}
				justifyContent={'flex-end'}
				sx={{ m: '10px 0px' }}
			>
				<div className={'msg_right'}></div>
			</Box>
		);
	} else {
		return (
			<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
				<Avatar alt={'jonik'} src={'/img/profile/defaultUser.svg'} />
				<div className={'msg_left'}></div>
			</Box>
		);
	}
};

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member | null;
	localMessage?: boolean;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member | null;
	action: string;
}

const Chat = () => {
	const chatContentRef = useRef<HTMLDivElement>(null);
	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<number>(0);
	const textInput = useRef(null);
	const [messageInput, setMessageInput] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [openButton, setOpenButton] = useState(false);
	const chatSocketRef = useRef<WebSocket | null>(null);
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const authToken = getJwtToken() ?? '';

	/** LIFECYCLES **/
	useEffect(() => {
		const socketUrl = new URL(process.env.REACT_APP_API_WS ?? process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:3007');
		if (socketUrl.protocol === 'http:') socketUrl.protocol = 'ws:';
		if (socketUrl.protocol === 'https:') socketUrl.protocol = 'wss:';
		if (authToken) socketUrl.searchParams.set('token', authToken);

		const chatSocket = new WebSocket(socketUrl.toString());
		chatSocketRef.current = chatSocket;

		chatSocket.onmessage = (msg) => {
			const data = JSON.parse(msg.data);
			console.log('Websocket message:', data);
			switch (data.event) {
				case 'info': {
					const newInfo: InfoPayload = data;
					setOnlineUsers(newInfo.totalClients);
					break;
				}
				case 'getMessages': {
					const list: MessagePayload[] = data.list;
					setMessagesList(Array.isArray(list) ? list : []);
					break;
				}
				case 'message': {
					const newMessage: MessagePayload = data;
					setMessagesList((currentMessages) => {
						const pendingIndex = currentMessages.findIndex(
							(message) => message.localMessage && message.text === newMessage.text,
						);
						if (pendingIndex === -1) return [...currentMessages, newMessage];

						const senderId = String(newMessage.memberData?._id ?? '').trim();
						const currentUserId = String(user?._id ?? '').trim();
						if (!senderId) return currentMessages;
						if (senderId !== currentUserId) return [...currentMessages, newMessage];

						return currentMessages.map((message, index) =>
							index === pendingIndex ? { ...newMessage, localMessage: false } : message,
						);
					});
					break;
				}
			}
		};

		return () => {
			chatSocket.onmessage = null;
			if (chatSocket.readyState < WebSocket.CLOSING) chatSocket.close();
			if (chatSocketRef.current === chatSocket) chatSocketRef.current = null;
		};
	}, [authToken, user?._id]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setOpenButton(true);
		}, 100);
		return () => clearTimeout(timeoutId);
	}, []);

	useEffect(() => {
		setOpenButton(false);
	}, [router.pathname]);

	/** HANDLERS **/
	const handleOpenChat = () => {
		setOpen((prevState) => !prevState);
	};

	const getInputMessageHandler = useCallback(
		(e: any) => {
			const text = e.target.value;
			setMessageInput(text);
		},
		[messageInput],
	);

	const getKeyHandler = (e: any) => {
		try {
			if (e.key == 'Enter') {
				onClickHandler();
			}
		} catch (err: any) {
			console.log(err);
		}
	};

	const onClickHandler = () => {
		if (!messageInput) sweetErrorAlert(Messages.error4);
		else {
			const socket = chatSocketRef.current;
			if (!socket || socket.readyState !== WebSocket.OPEN) {
				sweetErrorAlert(Messages.error1);
				return;
			}
			const text = messageInput;
			socket.send(JSON.stringify({ event: 'message', data: text }));
			setMessagesList((currentMessages) => [
				...currentMessages,
				{ event: 'message', text, memberData: null, localMessage: true },
			]);
			setMessageInput('');
		}
	};

	return (
		<Stack className="chatting">
			{openButton ? (
				<button className="chat-button" onClick={handleOpenChat}>
					{open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
				</button>
			) : null}
			<Stack className={`chat-frame ${open ? 'open' : ''}`}>
				<Box className={'chat-top'} component={'div'}>
					<div style={{ fontFamily: 'Nunito' }}>Online Chat</div>
					<RippleBadge style={{ margin: '-18px  0 0 21px' }} badgeContent={onlineUsers} />
				</Box>
				<Box className={'chat-content'} id="chat-content" ref={chatContentRef} component={'div'}>
					<ScrollableFeed>
						<Stack className={'chat-main'}>
							<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
								<div className={'welcome'}>Welcome to Live chat!</div>
							</Box>
							{messagesList.map((ele: MessagePayload) => {
								const { text, memberData } = ele;
								const memberImage = memberData?.memberImage
									? `${REACT_APP_API_URL}/${memberData.memberImage}`
									: '/img/profile/defaultUser.svg';
								const senderId = String(memberData?._id ?? '').trim();
								const currentUserId = String(user?._id ?? '').trim();
								const isOwnMessage = ele.localMessage || (currentUserId !== '' && senderId === currentUserId);
								return isOwnMessage ? (
									<Box
										component={'div'}
										flexDirection={'row'}
										style={{ display: 'flex' }}
										alignItems={'flex-end'}
										justifyContent={'flex-end'}
										sx={{ m: '10px 0px' }}
									>
										<div className={'msg-right'}>{text}</div>
									</Box>
								) : (
									<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
										<Avatar alt={'jonik'} src={memberImage} />
										<div className={'msg-left'}>{text}</div>
									</Box>
								);
							})}
						</Stack>
					</ScrollableFeed>
				</Box>
				<Box className={'chat-bott'} component={'div'}>
					<input
						type={'text'}
						name={'message'}
						className={'msg-input'}
						placeholder={'Type message'}
						value={messageInput}
						onChange={getInputMessageHandler}
						onKeyDown={getKeyHandler}
					/>
					<button className={'send-msg-btn'} onClick={onClickHandler}>
						<SendIcon style={{ color: '#fff' }} />
					</button>
				</Box>
			</Stack>
		</Stack>
	);
};

export default Chat;
