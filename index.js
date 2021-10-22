import React from 'react';
import { Select, Spin, Icon, message } from 'antd';
import _ from 'lodash';
import request from 'umi-request'

const Option = Select.Option;

/**
 * 基于 antd 的 select 组件二次封装
 */
export default class SelectWitchFetch extends React.Component {

    state = {
        list: [],   // 下拉框展示列表
        selectList: [], // 上一次接口请求的列表
        value: [],  // 选择项
        loading: false, // 请求loading状态
        tip: '',    // 无数据时展示文案
        dicData: undefined, // 总数据源
    };

    componentDidMount() {
        const { list = [], value, code = 'code' } = this.props;
        this.setState({ list, selectList: list });
        this.parseValue(value, code);
        this.loadingDataDelay = _.debounce(this.loadingData, 1000);
        this.props.initLoad && this.loadingDataDelay(); // 初始化后加载列表数据
    }

    componentWillReceiveProps(nextProps) {
        const { list: preList, value: preValue,   } = this.props;
        const { list, value, code = 'code' } = nextProps;
        if (list !== preList) {
            this.setState({ list, selectList: preList });
        }
        if (preValue !== value) {
            if (typeof value === 'object' && this.state.list.length === 0) {
                this.setState({ list: this.parseList(value) });
            }
            this.parseValue(value, code);
        }
    }
    /**
     * 转义正则表达式中的特殊字符串
     *
     * $ ( ) * + . [ ] ? ^ { } |
     */
    escapeRegularExpressionString = (str) => {
        let sEscape = str.replace('\\', '');
        sEscape = sEscape.replace('(', '\\(');
        sEscape = sEscape.replace(')', '\\)');
        sEscape = sEscape.replace('*', '\\*');
        sEscape = sEscape.replace('+', '\\+');
        sEscape = sEscape.replace('.', '\\.');
        sEscape = sEscape.replace('[', '\\[');
        sEscape = sEscape.replace(']', '\\]');
        sEscape = sEscape.replace('?', '\\?');
        sEscape = sEscape.replace('^', '\\^');
        sEscape = sEscape.replace('{', '\\{');
        sEscape = sEscape.replace('}', '\\}');
        sEscape = sEscape.replace('|', '\\|');
        sEscape = sEscape.replace('$', '\\$');
        return sEscape;
    };

    /**
     * 根据 value 初始化下拉列表
     * @param {*} value 
     * @returns 
     */
    parseList = (value) => {
        let list = [];
        const { code = 'code', name = 'name', mode } = this.props;
        if (Array.isArray(value)) {
            list = value;
        } else {
            list = [value];
        }
        if (mode === 'tags') {
            list = list.map(t => {
                if (typeof t === 'object') {
                    return t;
                }
                return {
                    [code]: t,
                    [name]: t,
                };
            });
        }
        return list;
    };

    /**
     * 解析并保存 value 的值
     * @param {*} value 
     * @param {*} code 
     */
    parseValue = (value, code) => {
        if (Array.isArray(value)) {
            this.setState({
                value: value.map(item => {
                    if (typeof item === 'object') {
                        return item[code];
                    }
                    return item;
                })
            });
        } else {
            this.setState({ value });
        }
    };

    handleSearch = (searchValue = '', initLoad) => {
        const { url } = this.props;
        searchValue = searchValue && searchValue.trim();
        const beforeFocus = this.props.onBeforeFocus && !this.props.onBeforeFocus()
        if (beforeFocus || !url || this.state.loading) {
            return false;
        }
        if (initLoad) {
            this.loadingData(searchValue);
        } else {
            this.loadingDataDelay(searchValue);
        }
    };

    /**
     * 根据搜索内容请求接口
     * @param {*} searchValue 
     */
    loadingData = (searchValue) => {
        const { url, apiListType, params = {}, stateCode, code = 'code', name = 'name', mode } = this.props;
        this.setParams(params, searchValue);
        this.setState({ loading: true });
        request.post(url, { data: params })
            .then(data => {
                // TODO 这个业务状态码和response结构都可以抽取
                if (data.state === stateCode) {
                    let list = [];
                    switch (apiListType) {
                        case 1: list = data.data.data || []; break;
                        case 2: list = data.data.data || []; break;
                        case 3: list = data.data.data || []; break;
                        default: list = data.data.list || [];
                    }
                    if (this.props.handleFilter) {
                        list = this.props.handleFilter(list);
                    }
                    list = this.addSingleSearch(this.props.value, searchValue, list, mode, code, name);
                    this.setState({
                        list: list,
                        dicData: data.data
                    }, this.addSelectOptions);
                    return
                }
                if (mode === 'singleSearch') {
                    this.setState({
                        list: this.addSingleSearch(this.props.value, searchValue, [], mode, code, name),
                        dicData: []
                    });
                    return
                }
                this.setState({
                    list: [],
                    tip: data && data.msg || '加载失败'
                });
            })
            .catch(error => {
                message.error(error)
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    addSingleSearch = (value, searchValue, list, mode, code, name) => {
        if (mode === 'singleSearch' && (value || searchValue)) {
            // singleSearch只适用 单选  并且可自定义  并且下拉列表为对象集合的模式
            let searchVal = searchValue ? searchValue : value;
            if (list.filter(item => item[code] === searchVal).length === 0) {
                let newItem = {};
                newItem[code] = searchVal;
                newItem[name] = searchVal;
                list.unshift(newItem);
            }
        }
        return list;
    };

    /**
     * 请求参数处理
     * @param {*} params 
     * @param {*} value 
     * @returns 
     */
    setParams = (params, value) => {
        for (let k in params) {
            if (typeof params[k] === 'object') {
                return this.setParams(params[k], value);
            }
            if (k === 'searchColumn') {
                params[params[k]] = value;
                break;
            }
        }
    };

    /**
     * 下拉框选项处理
     * @returns 
     */
    addSelectOptions = () => {
        const { list, selectList } = this.state;
        const { code = 'code', isNotCache } = this.props;
        if (!list || list.length === 0) {
            this.setState({ tip: '网络请求无数据' });
            return false;
        }
        if (!selectList) {
            return false;
        }
        let listData;
        if (isNotCache === true) {
            listData = list;
        } else {
            listData = list.filter(item => {
                let flag = true;
                for (let i = 0; i < selectList.length; i++) {
                    if (item[code] === selectList[i][code]) {
                        flag = false;
                        break;
                    }
                }
                return flag;
            });
            listData = [...selectList, ...listData];
        }
        this.setState({
            list: listData
        });
    };

    /**
     * 选择框数据过滤方法
     * @param {*} inputValue 
     * @param {*} option 
     * @returns 
     */
    filterOption = (inputValue, option) => {
        if (this.props.params && (!this.props.localSearch || this.props.localSearch !== 1)) {
            return true;
        }
        const sInputValue = this.escapeRegularExpressionString(inputValue);
        let regExp = new RegExp(sInputValue, 'gi');
        return regExp.test(option.props.children);
    };

    handleChange = (value, option) => {
        const maxCount = this.props.maxCount;
        const mode = this.props.mode;
        if (Array.isArray(value) && value.length > maxCount) {
            value.splice(maxCount, 1);
            message.warning(`所选项不能超过${maxCount}项`);
            return false;
        }
        if (this.props.noClearBySearch) {
            //noClearBySearch 适用于多选  本地搜索后下拉内容没有包含已选内容的情况  不会把已选内容清除
            if (this.props.onChange) {
                const { code = 'code', formType = 0 } = this.props;
                if (formType === 1) {
                    let list = Array.isArray(this.props.value) && this.props.value ? this.props.value.filter(item => value.indexOf(item[code]) > -1) : [];
                    const listData = this.state.list;
                    if (Array.isArray(option)) {
                        option.map(item => {
                            let obj;
                            for (let i = 0; i < listData.length; i++) {
                                if (listData[i][code] === item.props.value) {
                                    obj = listData[i];
                                    if (list.filter(element => element[code] === item.props.value).length === 0) {
                                        list.push(obj);
                                    }
                                    break;
                                }
                            }
                            return obj;
                        });
                    } else {
                        for (let i = 0; i < listData.length; i++) {
                            if (listData[i][code] === option.props.value) {
                                if (list.filter(element => element[code] === option.props.value).length === 0) {
                                    list.push(listData[i]);
                                }
                                break;
                            }
                        }
                    }
                    this.props.onChange(list, option);
                    if (this.props.handleChange) {
                        setTimeout(() => {
                            this.props.handleChange(list, option);
                        }, 500);
                    }
                } else {
                    this.props.onChange(value, option);
                    if (this.props.handleChange) {
                        setTimeout(() => {
                            this.props.handleChange(value, option);
                        }, 500);
                    }
                }
            }
        } else {
            if (this.props.onChange) {
                const { code = 'code', formType = 0 } = this.props;
                if (formType === 1) {
                    let list = [];
                    const listData = this.state.list;
                    if (Array.isArray(option)) {
                        list = option.map(item => {
                            let obj;
                            for (let i = 0; i < listData.length; i++) {
                                if (listData[i][code] === item.props.value) {
                                    obj = listData[i];
                                    break;
                                }
                            }
                            return obj;
                        })
                            .filter(item => item);
                    } else {
                        for (let i = 0; i < listData.length; i++) {
                            if (listData[i][code] === option.props.value) {
                                list = [listData[i]];
                                break;
                            }
                        }
                    }
                    this.props.onChange(list, option, this.state.dicData);
                    if (this.props.handleChange) {
                        setTimeout(() => {
                            this.props.handleChange(list, option);
                        }, 500);
                    }
                } else {
                    this.props.onChange(value, option, this.state.dicData);
                    if (this.props.handleChange) {
                        setTimeout(() => {
                            this.props.handleChange(value, option);
                        }, 500);
                    }
                }
            }
        }
    };

    render() {
        const { list = [], value, tip, loading } = this.state;
        const { code = 'code', name = 'name', style, disabledOption = [], ...otherProps } = this.props;
        return (
            <div>
                <Select
                    showSearch
                    {...otherProps}
                    onFocus={() => this.handleSearch('', true)}
                    filterOption={this.filterOption}
                    onChange={this.handleChange}
                    value={value}
                    onSearch={this.handleSearch}
                    style={style ? style : {
                        minWidth: 140,
                        width: '100%'
                    }}
                    notFoundContent={<Spin spinning={loading} size="small" indicator={<Icon type="loading" spin />}>{loading ? '加载中' : tip}</Spin>}
                >
                    {list.map(item => (
                        <Option
                            key={item[code]}
                            value={item[code]}
                            title={item[name]}
                            disabled={disabledOption.includes(item[code])}>{item[name]}</Option>
                    ))}
                </Select>
            </div>
        );
    }
}
