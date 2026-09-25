import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Stack, Box, Button, Pagination } from '@mui/material';
import { Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import AgentCard from '../../libs/components/common/AgentCard';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Member } from '../../libs/types/member/member';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_AGENTS } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const safeParseQueryInput = (value?: string | string[]) => {
	if (!value) return null;

	try {
		return typeof value === 'string' ? JSON.parse(value) : null;
	} catch (error) {
		return null;
	}
};

const AgentList: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const [filterSortName, setFilterSortName] = useState('Recent');
	const [sortingOpen, setSortingOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [searchFilter, setSearchFilter] = useState<any>(
		safeParseQueryInput(router?.query?.input as string | undefined) ?? initialInput,
	);
	const [agents, setAgents] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchText, setSearchText] = useState<string>('');
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	const {
		loading: getAgentsLoading,
		data: getAgentsData,
		error: getAgentsError,
		refetch: getAgentsRefetch,
	} = useQuery(GET_AGENTS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted(data: T) {
			setAgents(data?.getAgents?.list);
			setTotal(data?.getAgents?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (!router.isReady) return;

		const parsedInput = safeParseQueryInput(router.query.input as string | undefined);

		if (parsedInput) {
			setSearchFilter((prev: any) => {
				return JSON.stringify(prev) === JSON.stringify(parsedInput) ? prev : parsedInput;
			});
			setCurrentPage(parsedInput.page ?? 1);
			return;
		}

		const nextFilter = { ...initialInput, ...searchFilter };
		setSearchFilter(nextFilter);
		setCurrentPage(nextFilter.page ?? 1);
		void router.replace(
			{ pathname: '/agent', query: { input: JSON.stringify(nextFilter) } },
			undefined,
			{ shallow: true, scroll: false },
		);
	}, [router.isReady, router.query.input]);
	

	/** HANDLERS **/
	const sortingClickHandler = (e: MouseEvent<HTMLElement>) => {
		setAnchorEl(e.currentTarget);
		setSortingOpen(true);
	};

	const sortingCloseHandler = () => {
		setSortingOpen(false);
		setAnchorEl(null);
	};

	const sortingHandler = async (e: React.MouseEvent<HTMLLIElement>) => {
		let nextFilter = { ...searchFilter };

		switch (e.currentTarget.id) {
			case 'recent':
				nextFilter = { ...nextFilter, sort: 'createdAt', direction: 'DESC' };
				setFilterSortName('Recent');
				break;
			case 'old':
				nextFilter = { ...nextFilter, sort: 'createdAt', direction: 'ASC' };
				setFilterSortName('Oldest order');
				break;
			case 'likes':
				nextFilter = { ...nextFilter, sort: 'memberLikes', direction: 'DESC' };
				setFilterSortName('Likes');
				break;
			case 'views':
				nextFilter = { ...nextFilter, sort: 'memberViews', direction: 'DESC' };
				setFilterSortName('Views');
				break;
		}

		setSearchFilter(nextFilter);
		setCurrentPage(nextFilter.page ?? 1);
		setSortingOpen(false);
		setAnchorEl2(null);
		await router.push({ pathname: '/agent', query: { input: JSON.stringify(nextFilter) } }, undefined, {
			scroll: false,
			shallow: true,
		});
	};

	const paginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		const nextFilter = { ...searchFilter, page: value };
		setSearchFilter(nextFilter);
		setCurrentPage(value);
		await router.push({ pathname: '/agent', query: { input: JSON.stringify(nextFilter) } }, undefined, {
			scroll: false,
			shallow: true,
		});
	};

	const likeMemberHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);

			await likeTargetMember({
				variables: {
					input: id,
				},
			});
			await getAgentsRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (error: any) {
			await sweetMixinErrorAlert(error.message);
		}
	};

	if (device === 'mobile') {
		return <h1>AGENTS PAGE MOBILE</h1>;
	} else {
		return (
			<Stack className={'agent-list-page'}>
				<Stack className={'container'}>
					<Stack className={'filter'}>
						<Box component={'div'} className={'left'}>
							<input
								type="text"
								placeholder={'Search for an agent'}
								value={searchText}
								onChange={(e: any) => setSearchText(e.target.value)}
								onKeyDown={async (event: any) => {
									if (event.key === 'Enter') {
										const nextFilter = {
											...searchFilter,
											page: 1,
											search: { ...searchFilter.search, text: searchText },
										};
										setSearchFilter(nextFilter);
										setCurrentPage(1);
										void router.push(
											{ pathname: '/agent', query: { input: JSON.stringify(nextFilter) } },
											undefined,
											{ scroll: false, shallow: true },
										);
									}
								}}
							/>
						</Box>
						<Box component={'div'} className={'right'}>
							<span>Sort by</span>
							<div>
								<Button onClick={sortingClickHandler} endIcon={<KeyboardArrowDownRoundedIcon />}>
									{filterSortName}
								</Button>
								<Menu anchorEl={anchorEl} open={sortingOpen} onClose={sortingCloseHandler} sx={{ paddingTop: '5px' }}>
									<MenuItem onClick={sortingHandler} id={'recent'} disableRipple>
										Recent
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'old'} disableRipple>
										Oldest
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'likes'} disableRipple>
										Likes
									</MenuItem>
									<MenuItem onClick={sortingHandler} id={'views'} disableRipple>
										Views
									</MenuItem>
								</Menu>
							</div>
						</Box>
					</Stack>
					<Stack className={'card-wrap'}>
						{agents?.length === 0 ? (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No Agents found!</p>
							</div>
						) : (
							agents.map((agent: Member) => {

								return <AgentCard agent={agent} key={agent._id} likeMemberHandler={likeMemberHandler} />;
							})
						)}
					</Stack>
					<Stack className={'pagination'}>
						<Stack className="pagination-box">
							{agents.length !== 0 && Math.ceil(total / searchFilter.limit) > 1 && (
								<Stack className="pagination-box">
									<Pagination
										page={currentPage}
										count={Math.ceil(total / searchFilter.limit)}
										onChange={paginationChangeHandler}
										shape="circular"
										color="primary"
									/>
								</Stack>
							)}
						</Stack>

						{agents.length !== 0 && (
							<span>
								Total {total} agent{total > 1 ? 's' : ''} available
							</span>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

AgentList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withLayoutBasic(AgentList);
