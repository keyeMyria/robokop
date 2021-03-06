import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import PubmedEntry from './PubmedEntry';

class PubmedList extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      list: {
        border: 'none',
        marginTop: '0px',
        outline: 'none',
      },
      row: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '5px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
      },
    };

    this.noRowsRenderer = this.noRowsRenderer.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  rowRenderer({
    index,
    isScrolling,
    key,
    style,
  }) {
    return (
      <div
        style={{ ...style, ...this.styles.row }}
        key={key}
      >
        {isScrolling &&
          <div style={{ color: '#ccc' }}>
            Loading...
          </div>
        }
        {!isScrolling &&
          <PubmedEntry
            pmid={this.props.publications[index]}
          />
        }
      </div>
    );
  }
  noRowsRenderer() {
    return (
      <Row>
        <Col md={12}>
          <h5 style={{ padding: '15px' }}>
            {'No Publications Found'}
          </h5>
        </Col>
      </Row>
    );
  }

  render() {
    const rowCount = this.props.publications.length;
    const listHeight = Math.max(Math.min((rowCount * 100), 500), 100);

    return (
      <AutoSizer disableHeight defaultWidth={100}>
        {({ width }) => (
          <List
            ref={(ref) => { this.list = ref; }}
            style={this.styles.list}
            height={listHeight}
            overscanRowCount={10}
            rowCount={rowCount}
            rowHeight={100}
            noRowsRenderer={this.noRowsRenderer}
            rowRenderer={this.rowRenderer}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }
}

export default PubmedList;
